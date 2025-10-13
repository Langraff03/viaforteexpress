// src/lib/websocket-server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from './server/supabaseAdmin';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  campaignIds?: Set<string>;
}

interface CampaignProgressUpdate {
  campaign_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused' | 'cancelled';
  total_leads: number;
  sent_count: number;
  failed_count: number;
  progress_percent: number;
  estimated_completion?: string;
  current_batch?: number;
  total_batches?: number;
  rate_limit_remaining?: number;
  last_email_sent?: string;
}

class CampaignWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/campaign-progress',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('🟢 WebSocket Server inicializado em /ws/campaign-progress');
  }

  private async verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }) {
    try {
      const url = parse(info.req.url || '', true);
      const token = url.query.token as string;

      if (!token) {
        console.log('❌ WebSocket: Token não fornecido');
        return false;
      }

      // Verificar JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      if (!decoded.userId) {
        console.log('❌ WebSocket: Token inválido');
        return false;
      }

      // Armazenar userId no request para usar no handleConnection
      (info.req as any).userId = decoded.userId;
      return true;
    } catch (error) {
      console.log('❌ WebSocket: Erro na verificação do cliente:', error);
      return false;
    }
  }

  private async handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage) {
    const userId = (request as any).userId;
    ws.userId = userId;
    ws.campaignIds = new Set();

    console.log(`🟢 Cliente WebSocket conectado: ${userId}`);

    // Adicionar cliente ao mapa
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);

    // Buscar campanhas ativas do usuário
    try {
      const { data: campaigns, error } = await supabaseAdmin
        .from('campaign_progress')
        .select('campaign_id')
        .eq('user_id', userId)
        .in('status', ['queued', 'processing', 'paused']);

      if (!error && campaigns) {
        campaigns.forEach(campaign => {
          ws.campaignIds!.add(campaign.campaign_id);
        });
        console.log(`📊 Cliente ${userId} inscrito em ${campaigns.length} campanhas`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas do usuário:', error);
    }

    // Configurar handlers de mensagens
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        this.handleMessage(ws, data);
      } catch (error) {
        console.error('❌ Erro ao processar mensagem WebSocket:', error);
      }
    });

    // Cleanup quando desconectar
    ws.on('close', () => {
      console.log(`🔴 Cliente WebSocket desconectado: ${userId}`);
      const userClients = this.clients.get(userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          this.clients.delete(userId);
        }
      }
    });

    // Enviar status inicial das campanhas
    this.sendInitialCampaignStatus(ws);
  }

  private async handleMessage(ws: AuthenticatedWebSocket, data: any) {
    const { type, payload } = data;

    switch (type) {
      case 'subscribe_campaign':
        if (payload.campaign_id) {
          // Verificar se o usuário tem acesso a esta campanha
          const hasAccess = await this.verifyCampaignAccess(ws.userId!, payload.campaign_id);
          if (hasAccess) {
            ws.campaignIds!.add(payload.campaign_id);
            console.log(`📊 Cliente ${ws.userId} inscrito na campanha ${payload.campaign_id}`);
          }
        }
        break;

      case 'unsubscribe_campaign':
        if (payload.campaign_id) {
          ws.campaignIds!.delete(payload.campaign_id);
          console.log(`📊 Cliente ${ws.userId} desinscrito da campanha ${payload.campaign_id}`);
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  private async verifyCampaignAccess(userId: string, campaignId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('lead_campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('user_id', userId)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('❌ Erro ao verificar acesso à campanha:', error);
      return false;
    }
  }

  private async sendInitialCampaignStatus(ws: AuthenticatedWebSocket) {
    if (!ws.userId || ws.campaignIds!.size === 0) return;

    try {
      const campaignIds = Array.from(ws.campaignIds!);
      const { data: progresses, error } = await supabaseAdmin
        .from('campaign_progress')
        .select('*')
        .in('campaign_id', campaignIds);

      if (!error && progresses) {
        progresses.forEach(progress => {
          ws.send(JSON.stringify({
            type: 'campaign_progress',
            data: progress
          }));
        });
      }
    } catch (error) {
      console.error('❌ Erro ao enviar status inicial das campanhas:', error);
    }
  }

  // Método público para broadcast de updates
  public broadcastCampaignUpdate(update: CampaignProgressUpdate) {
    console.log(`📡 Broadcasting update para campanha ${update.campaign_id}`);

    // Encontrar todos os clientes interessados nesta campanha
    for (const [userId, userClients] of this.clients.entries()) {
      userClients.forEach(ws => {
        if (ws.campaignIds?.has(update.campaign_id) && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'campaign_progress',
            data: update,
            timestamp: new Date().toISOString()
          }));
        }
      });
    }
  }

  // Enviar mensagem específica para um usuário
  public sendToUser(userId: string, message: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }

  // Estatísticas do servidor
  public getStats() {
    const totalClients = Array.from(this.clients.values()).reduce((sum, set) => sum + set.size, 0);
    const activeUsers = this.clients.size;

    return {
      activeUsers,
      totalClients,
      connectedUsers: Array.from(this.clients.keys())
    };
  }

  // Cleanup para shutdown graceful
  public async shutdown() {
    console.log('🔴 Encerrando WebSocket Server...');
    this.clients.clear();
    this.wss.close();
  }
}

export default CampaignWebSocketServer;
export type { CampaignProgressUpdate };