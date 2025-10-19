import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, AlertCircle, Clock, Mail, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';

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

interface CampaignProgressTrackerProps {
  campaignId: string;
  onComplete?: (status: 'completed' | 'failed' | 'cancelled') => void;
  onError?: (error: string) => void;
}

export const CampaignProgressTracker: React.FC<CampaignProgressTrackerProps> = ({
  campaignId,
  onComplete,
  onError
}) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<CampaignProgressUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const webhookServerUrl = (import.meta.env.VITE_WEBHOOK_SERVER_URL || 'http://localhost:3001').replace('http', 'ws');

  // Conectar WebSocket
  useEffect(() => {
    if (!user?.id || !campaignId) return;

    const connectWebSocket = () => {
      try {
        // Gerar JWT token simples (em produção, usar token real do Supabase)
        const token = btoa(JSON.stringify({ userId: user.id }));
        const wsUrl = `${webhookServerUrl}/ws/campaign-progress?token=${token}`;
        
        console.log(`🔌 Conectando WebSocket: ${wsUrl}`);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('🟢 WebSocket conectado');
          setIsConnected(true);
          setError(null);
          
          // Inscrever-se na campanha
          wsRef.current?.send(JSON.stringify({
            type: 'subscribe_campaign',
            payload: { campaign_id: campaignId }
          }));
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📡 WebSocket message:', data);

            if (data.type === 'campaign_progress' && data.data.campaign_id === campaignId) {
              const update = data.data as CampaignProgressUpdate;
              setProgress(update);

              // Marcar hora de início
              if (update.status === 'processing' && !startTime) {
                setStartTime(new Date());
              }

              // Notificar conclusão
              if (['completed', 'failed', 'cancelled'].includes(update.status)) {
                onComplete?.(update.status as any);
              }
            }

            if (data.type === 'pong') {
              console.log('🏓 WebSocket pong received');
            }
          } catch (err) {
            console.error('❌ Erro ao processar mensagem WebSocket:', err);
          }
        };

        wsRef.current.onerror = (event) => {
          console.error('❌ WebSocket error:', event);
          setError('Erro na conexão WebSocket');
          setIsConnected(false);
        };

        wsRef.current.onclose = (event) => {
          console.log('🔴 WebSocket desconectado:', event.code, event.reason);
          setIsConnected(false);
          
          // Reconectar após 3 segundos se não foi intencional
          if (event.code !== 1000) {
            setTimeout(connectWebSocket, 3000);
          }
        };
      } catch (err) {
        console.error('❌ Erro ao conectar WebSocket:', err);
        setError('Falha ao conectar WebSocket');
      }
    };

    connectWebSocket();

    // Ping periódico para manter conexão
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      wsRef.current?.close(1000, 'Component unmounted');
    };
  }, [user?.id, campaignId, webhookServerUrl, onComplete]);

  // Funções de controle
  const pauseCampaign = async () => {
    try {
      const webhookUrl = webhookServerUrl.replace('ws', 'http');
      const response = await fetch(`${webhookUrl}/api/mass-email/pause/${campaignId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Falha ao pausar campanha');
    } catch (err) {
      console.error('❌ Erro ao pausar campanha:', err);
      onError?.('Erro ao pausar campanha');
    }
  };

  const resumeCampaign = async () => {
    try {
      const webhookUrl = webhookServerUrl.replace('ws', 'http');
      const response = await fetch(`${webhookUrl}/api/mass-email/resume/${campaignId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Falha ao retomar campanha');
    } catch (err) {
      console.error('❌ Erro ao retomar campanha:', err);
      onError?.('Erro ao retomar campanha');
    }
  };

  const cancelCampaign = async () => {
    if (!confirm('Tem certeza que deseja cancelar esta campanha?')) return;
    
    try {
      const webhookUrl = webhookServerUrl.replace('ws', 'http');
      const response = await fetch(`${webhookUrl}/api/mass-email/cancel/${campaignId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Falha ao cancelar campanha');
    } catch (err) {
      console.error('❌ Erro ao cancelar campanha:', err);
      onError?.('Erro ao cancelar campanha');
    }
  };

  // Calcular estatísticas
  const getElapsedTime = () => {
    if (!startTime) return '00:00:00';
    const elapsed = Date.now() - startTime.getTime();
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'paused': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Aguardando';
      case 'processing': return 'Processando';
      case 'completed': return 'Concluída';
      case 'failed': return 'Falhou';
      case 'paused': return 'Pausada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <h3 className="text-red-800 font-medium">Erro na Conexão</h3>
        </div>
        <p className="text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Progresso da Campanha</h2>
          <p className="text-gray-500 text-sm">ID: {campaignId}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-sm text-gray-500">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {progress && (
        <div className="space-y-6">
          {/* Status Badge */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(progress.status)}`}>
            {getStatusText(progress.status)}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progresso</span>
              <span>{progress.progress_percent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.progress_percent}%` }}
              />
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-gray-900">{progress.total_leads.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Enviados</p>
                  <p className="font-semibold text-green-900">{progress.sent_count.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Falhas</p>
                  <p className="font-semibold text-red-900">{progress.failed_count.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-500">Tempo</p>
                  <p className="font-semibold text-blue-900">{getElapsedTime()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Progress */}
          {progress.current_batch && progress.total_batches && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Lote {progress.current_batch} de {progress.total_batches}</span>
                <span>Taxa: {progress.rate_limit_remaining || 'N/A'} req/s</span>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          {progress.status !== 'completed' && progress.status !== 'cancelled' && (
            <div className="flex space-x-3">
              {progress.status === 'processing' && (
                <button
                  onClick={pauseCampaign}
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </button>
              )}

              {progress.status === 'paused' && (
                <button
                  onClick={resumeCampaign}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Continuar
                </button>
              )}

              <button
                onClick={cancelCampaign}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 h-4 mr-2" />
                Cancelar
              </button>
            </div>
          )}

          {/* Success Message */}
          {progress.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                <div>
                  <h3 className="text-green-800 font-medium">Campanha Concluída!</h3>
                  <p className="text-green-700 text-sm">
                    {progress.sent_count} emails enviados com sucesso de {progress.total_leads} leads
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!progress && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Aguardando dados da campanha...</p>
        </div>
      )}
    </div>
  );
};

export default CampaignProgressTracker;