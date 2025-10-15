// src/webhook-server/index.ts
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
// import { assetWebhookHandler } from './handlers/asset'; // Will be replaced by generic
import { genericWebhookHandler } from './handlers/genericWebhookHandler';
import { getConfig, saveConfig, testEmailConfig, testGatewayConfig } from './handlers/config';
// import validateWebhookRequest to debug, commented out below
import { queueEmail, queueTrackingCodeGeneration, queuePaymentWebhook, generateTrackingCode, queueMassEmailCampaign, pauseCampaign, resumeCampaign, cancelCampaign } from '../lib/queue';
import invoiceRoutes from '../routes/invoiceRoutes';
import leadCampaignRoutes from '../routes/leadCampaignRoutes';
import CampaignWebSocketServer from '../lib/websocket-server';
const app = express();
const server = createServer(app);
// Inicializar WebSocket server
let websocketServer;
// 🔓 CORS liberado para tudo (ajuste em produção)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization']
}));
// Permite JSON no body, and capture raw body for webhook signature validation
app.use(express.json({
    limit: '50mb', // ✅ URGENTE: Aumentar limite para suportar 10K+ leads
    verify: (req, res, buf, encoding) => {
        if (buf && buf.length) {
            req.rawBody = buf;
        }
    }
}));
// ─── Asset Webhook Handler ──────────────────────────────────────────────────
// Este endpoint irá lidar com webhooks do gateway Asset.
// O parâmetro :gatewayName deve ser 'asset'.
// ClientID pode vir da URL, query param, ou derivado do payload.
// Exemplo: /webhook/asset?clientId=client123
app.post('/webhook/:gatewayName', genericWebhookHandler);
// If you prefer clientId in the path:
// app.post('/webhook/:gatewayName/:clientId', genericWebhookHandler);
// ─── Configurações ────────────────────────────────────────────────────────────
app.get('/api/config', getConfig);
app.post('/api/config/save', saveConfig);
app.post('/api/config/test-email', testEmailConfig);
app.post('/api/config/test-gateway', testGatewayConfig);
// ─── Nota Fiscal (Acesso Público) ─────────────────────────────────────────────
app.use('/api', invoiceRoutes);
// ─── Campanhas de Leads ────────────────────────────────────────────────────────
app.use('/api/lead-campaigns', leadCampaignRoutes);
// ─── Fila / Queue API ──────────────────────────────────────────────────────────
app.post('/api/email/queue', async (req, res) => {
    try {
        await queueEmail(req.body);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/tracking/queue', async (req, res) => {
    try {
        await queueTrackingCodeGeneration(req.body);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/payment/queue', async (req, res) => {
    try {
        await queuePaymentWebhook(req.body);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ─── Geração ad hoc de código de rastreio ───────────────────────────────────────
app.get('/api/tracking/generate-code', (_req, res) => {
    // Usar um UUID válido em vez de 'default'
    const code = generateTrackingCode('747e0d51-609f-4102-9927-d3685edd83bf');
    res.json({ code });
});
// ─── Healthcheck ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
// ─── Controle de Campanhas de Massa ──────────────────────────────────────────
app.post('/api/mass-email/start', async (req, res) => {
    try {
        console.log('🔍 [DEBUG] Payload recebido em /api/mass-email/start:', JSON.stringify(req.body, null, 2));
        console.log('🔍 [DEBUG] campaign_id no payload:', req.body.campaign_id);
        if (!req.body.campaign_id) {
            console.error('❌ [DEBUG] campaign_id está undefined/null!');
            return res.status(400).json({ error: 'campaign_id é obrigatório' });
        }
        await queueMassEmailCampaign(req.body);
        res.json({ success: true });
    }
    catch (err) {
        console.error('❌ [DEBUG] Erro em /api/mass-email/start:', err);
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/mass-email/pause/:campaignId', async (req, res) => {
    try {
        const success = await pauseCampaign(req.params.campaignId);
        if (success) {
            // Atualizar status no banco
            // TODO: Implementar atualização do status no banco
            res.json({ success: true, message: 'Campanha pausada' });
        }
        else {
            res.status(500).json({ error: 'Falha ao pausar campanha' });
        }
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/mass-email/resume/:campaignId', async (req, res) => {
    try {
        const success = await resumeCampaign(req.params.campaignId);
        if (success) {
            // TODO: Implementar lógica de retomada da campanha
            res.json({ success: true, message: 'Campanha retomada' });
        }
        else {
            res.status(500).json({ error: 'Falha ao retomar campanha' });
        }
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/mass-email/cancel/:campaignId', async (req, res) => {
    try {
        const success = await cancelCampaign(req.params.campaignId);
        if (success) {
            // Atualizar status no banco
            // TODO: Implementar atualização do status no banco
            res.json({ success: true, message: 'Campanha cancelada' });
        }
        else {
            res.status(500).json({ error: 'Falha ao cancelar campanha' });
        }
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ─── WebSocket Stats (Debug) ──────────────────────────────────────────────────
app.get('/api/websocket/stats', (req, res) => {
    if (websocketServer) {
        res.json(websocketServer.getStats());
    }
    else {
        res.json({ error: 'WebSocket server não inicializado' });
    }
});
// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.WEBHOOK_PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Servidor HTTP rodando na porta ${PORT}`);
    // Inicializar WebSocket server após o servidor HTTP estar rodando
    websocketServer = new CampaignWebSocketServer(server);
    console.log(`🔗 WebSocket server inicializado em ws://localhost:${PORT}/ws/campaign-progress`);
});
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🔴 Encerrando servidor...');
    if (websocketServer) {
        await websocketServer.shutdown();
    }
    process.exit(0);
});
// Exportar websocketServer para uso nos workers
export { websocketServer };
//# sourceMappingURL=index.js.map