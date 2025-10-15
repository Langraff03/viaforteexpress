import crypto from 'crypto';
import { supabaseAdmin } from '../../lib/server/supabaseAdmin';
const ALLOWED_IPS = {
    asset: [
        '34.195.33.156',
        '34.195.252.238',
        '52.67.194.91',
        '54.94.171.84',
    ]
};
export const validateWebhookRequest = () => {
    return async (req, res, next) => {
        const clientIp = req.ip || req.socket.remoteAddress || '';
        const clientId = req.query.client_id;
        const gatewayType = req.query.gateway_type || 'asset'; // Default para compatibilidade
        if (!clientId) {
            console.error('client_id não fornecido na query string');
            return res.status(400).json({ error: 'client_id é obrigatório' });
        }
        // Validar IP de origem
        if (!clientIp || !ALLOWED_IPS.asset.includes(clientIp)) {
            console.warn(`IP não autorizado tentando acessar webhook do Asset: ${clientIp}`);
            return res.status(403).json({ error: 'IP não autorizado' });
        }
        try {
            let webhookSecret;
            const effectiveClientId = clientId === 'default' ? '0ec3137d-ee68-4aba-82de-143b3c61516a' : clientId;
            // Buscar configuração do gateway no banco de dados
            const { data: gateway, error } = await supabaseAdmin
                .from('gateways')
                .select('config')
                .eq('client_id', effectiveClientId)
                .eq('type', gatewayType)
                .single();
            if (error || !gateway) {
                console.error(`Erro ao buscar configuração do gateway para client_id=${effectiveClientId}, type=${gatewayType}:`, error?.message);
                return res.status(404).json({ error: 'Configuração de gateway não encontrada' });
            }
            const config = gateway.config || {};
            webhookSecret = config.webhook_secret;
            if (!webhookSecret) {
                console.error(`[Webhook] webhook_secret não encontrado no objeto 'config' para client_id=${effectiveClientId}`);
                // Pular validação se não houver segredo, mas logar o erro.
                console.warn(`[Webhook] A validação de assinatura está sendo pulada. ISSO NÃO É SEGURO PARA PRODUÇÃO.`);
                return next();
            }
            // Validar assinatura do Asset
            const signature = req.headers['x-signature'];
            const timestamp = req.headers['x-timestamp'];
            const payload = JSON.stringify(req.body);
            if (!signature || !timestamp) {
                return res.status(400).json({ error: 'Cabeçalhos de segurança ausentes' });
            }
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(`${payload}${timestamp}`)
                .digest('hex');
            if (signature !== expectedSignature) {
                return res.status(403).json({ error: 'Assinatura inválida' });
            }
            // Adicionar informações do gateway ao request para uso posterior
            req.gatewayInfo = {
                clientId,
                gatewayType,
                webhookSecret
            };
            next();
        }
        catch (err) {
            console.error('Erro ao validar webhook:', err);
            return res.status(500).json({ error: 'Erro interno ao validar webhook' });
        }
    };
};
