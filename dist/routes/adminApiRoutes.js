import { Router } from 'express';
import { getGatewayForClient } from '../lib/gateways/gatewaySelector';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro
const adminRouter = Router();
// Middleware de autenticação real que verifica o token JWT do Supabase
const ensureAuthenticated = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401);
        return res.json({ error: 'Unauthorized: Missing or invalid token.' });
    }
    const token = authHeader.split(' ')[1];
    // Valida o token e obtém o usuário
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token.', details: error?.message });
    }
    // Anexa o usuário à requisição para uso posterior
    req.user = user;
    next();
};
// Aplica o middleware de autenticação a todas as rotas de admin
adminRouter.use(ensureAuthenticated);
// Endpoint para buscar detalhes completos do usuário logado
adminRouter.get('/user-details', async (req, res) => {
    try {
        // O middleware 'ensureAuthenticated' já validou o usuário e o anexou a req.user
        const userId = req.user.id;
        // ✅ Usando cliente admin seguro já importado
        // Busque os dados do usuário na tabela 'users'
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('*, client:clients(name), gateway:gateways(type)')
            .eq('id', userId)
            .single();
        if (userError)
            throw userError;
        if (!userData)
            return res.status(404).json({ error: 'User not found.' });
        res.json(userData);
    }
    catch (err) {
        console.error('[Admin API] Error fetching user details:', err.message);
        res.status(500).json({ error: 'Failed to fetch user details.', details: err.message });
    }
});
// --- Orders API ---
// GET /api/admin/orders?gateway=asset&clientId=cliente-asset&limit=20&offset=0
adminRouter.get('/orders', async (req, res) => {
    const { gateway, clientId, limit = '20', offset = '0' } = req.query;
    // Validação básica
    if (!gateway && !clientId) {
        return res.status(400).json({ error: 'Either "gateway" or "clientId" query parameter must be provided.' });
    }
    try {
        let query = supabaseAdmin.from('orders').select('*');
        if (gateway)
            query = query.eq('gateway', gateway);
        if (clientId)
            query = query.eq('client_id', clientId); // Assume a coluna 'client_id' da migração
        query = query.order('created_at', { ascending: false });
        query = query.range(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10) - 1);
        const { data, error, count } = await query;
        if (error)
            throw error;
        res.json({ orders: data, totalCount: count }); // Supabase pode retornar a contagem total em `count` com `count: 'exact'`
    }
    catch (err) {
        console.error('[Admin API] Error fetching admin orders:', err.message);
        res.status(500).json({ error: 'Failed to fetch orders.', details: err.message });
    }
});
// --- Payment Actions API ---
// POST /api/admin/payments/:paymentId/cancel
adminRouter.post('/payments/:paymentId/cancel', async (req, res) => {
    const { paymentId } = req.params;
    const { clientId } = req.body; // ClientId é crucial para selecionar a instância correta do gateway
    if (!clientId) {
        return res.status(400).json({ error: 'clientId is required in the request body.' });
    }
    if (!paymentId) {
        return res.status(400).json({ error: 'paymentId is required in the URL path.' });
    }
    try {
        const gateway = await getGatewayForClient(clientId); // Aguardar a resolução da Promise
        if (gateway.cancelPayment) {
            const result = await gateway.cancelPayment(paymentId);
            if (result) {
                // Opcionalmente, atualize o status do seu pedido local aqui imediatamente,
                // ou confie em um webhook se o gateway enviar um para cancelamentos.
                // Exemplo:
                // await supabaseAdmin.from('orders').update({ payment_status: result.status, updated_at: new Date() })
                //   .eq('payment_id', paymentId).eq('client_id', clientId);
                console.log(`[Admin API] Payment ${paymentId} for client ${clientId} cancellation result:`, result);
                res.json({ success: true, data: result });
            }
            else {
                res.status(404).json({ error: `Payment ${paymentId} not found or could not be cancelled via gateway.` });
            }
        }
        else {
            res.status(501).json({ error: 'cancelPayment method not implemented for this gateway.' });
        }
    }
    catch (err) {
        console.error(`[Admin API] Error cancelling payment ${paymentId} for client ${clientId}:`, err.message);
        res.status(500).json({ error: 'Failed to cancel payment.', details: err.message });
    }
});
// GET /api/admin/payments/:paymentId/details?clientId=...
adminRouter.get('/payments/:paymentId/details', async (req, res) => {
    const { paymentId } = req.params;
    const { clientId } = req.query;
    if (!clientId)
        return res.status(400).json({ error: 'clientId query parameter is required.' });
    if (!paymentId)
        return res.status(400).json({ error: 'paymentId path parameter is required.' });
    try {
        const gateway = await getGatewayForClient(clientId); // Aguardar a resolução da Promise
        if (gateway.getPayment) {
            const details = await gateway.getPayment(paymentId);
            if (details) {
                res.json(details);
            }
            else {
                res.status(404).json({ error: `Payment ${paymentId} not found via gateway for client ${clientId}.` });
            }
        }
        else {
            res.status(501).json({ error: 'getPayment method not implemented for this gateway.' });
        }
    }
    catch (err) {
        console.error(`[Admin API] Error fetching payment details for ${paymentId}, client ${clientId}:`, err.message);
        res.status(500).json({ error: 'Failed to fetch payment details.', details: err.message });
    }
});
// --- API de Configurações de Gateway (interage com a tabela `gateway_configs`) ---
// GET /api/admin/gateway-configurations?clientId=some-client&gateway_provider=asset
adminRouter.get('/gateway-configurations', async (req, res) => {
    const { clientId, gateway_provider } = req.query;
    if (!clientId || !gateway_provider) {
        return res.status(400).json({ error: 'clientId and gateway_provider query parameters are required.' });
    }
    try {
        const { data, error } = await supabaseAdmin
            .from('gateway_configs')
            .select('*')
            .eq('client_id', clientId)
            .eq('gateway_provider', gateway_provider)
            .maybeSingle(); // Use maybeSingle pois a configuração pode ainda não existir
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ message: 'Configuration not found.' });
        res.json({ config: data });
    }
    catch (err) {
        console.error('[Admin API] Error fetching gateway configuration:', err.message);
        res.status(500).json({ error: 'Failed to fetch gateway configuration.', details: err.message });
    }
});
// POST /api/admin/gateway-configurations (Create new)
adminRouter.post('/gateway-configurations', async (req, res) => {
    const { client_id, gateway_provider, ...settings } = req.body;
    if (!client_id || !gateway_provider) {
        return res.status(400).json({ error: 'client_id and gateway_provider are required.' });
    }
    try {
        const { data, error } = await supabaseAdmin
            .from('gateway_configs')
            .insert([{ client_id, gateway_provider, ...settings, updated_at: new Date() }])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json({ config: data });
    }
    catch (err) {
        console.error('[Admin API] Error creating gateway configuration:', err.message);
        if (err.code === '23505') { // Violação de restrição única
            return res.status(409).json({ error: 'Configuration for this client and gateway already exists.', details: err.message });
        }
        res.status(500).json({ error: 'Failed to create gateway configuration.', details: err.message });
    }
});
// PUT /api/admin/gateway-configurations/:configId (Update existing)
adminRouter.put('/gateway-configurations/:configId', async (req, res) => {
    const { configId } = req.params;
    const { client_id, gateway_provider, ...settings } = req.body; // client_id e provider podem não ser atualizáveis desta forma
    if (!configId)
        return res.status(400).json({ error: 'Config ID is required.' });
    try {
        const { data, error } = await supabaseAdmin
            .from('gateway_configs')
            .update({ ...settings, updated_at: new Date() })
            .eq('id', configId)
            .select()
            .single();
        if (error)
            throw error;
        if (!data)
            return res.status(404).json({ error: 'Configuration not found to update.' });
        res.json({ config: data });
    }
    catch (err) {
        console.error('[Admin API] Error updating gateway configuration:', err.message);
        res.status(500).json({ error: 'Failed to update gateway configuration.', details: err.message });
    }
});
// ==================== API ENDPOINTS PARA DOMÍNIOS DE EMAIL ====================
/**
 * GET /api/admin/email-domains
 * Lista todos os domínios de email ativos
 */
adminRouter.get('/email-domains', async (req, res) => {
    try {
        const { data: domains, error } = await supabaseAdmin
            .from('email_domains')
            .select('*')
            .order('is_default', { ascending: false })
            .order('domain_name');
        if (error) {
            console.error('[Admin API] Error fetching email domains:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao buscar domínios',
                details: error.message
            });
        }
        res.json({
            success: true,
            domains: domains || []
        });
    }
    catch (err) {
        console.error('[Admin API] Exception in email-domains GET:', err.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno',
            details: err.message
        });
    }
});
/**
 * POST /api/admin/email-domains
 * Cria um novo domínio de email
 */
adminRouter.post('/email-domains', async (req, res) => {
    try {
        const { domain_name, from_name, from_email, reply_to_email, resend_api_key, is_active = true } = req.body;
        // Validação de campos obrigatórios
        if (!domain_name || !from_name || !from_email || !reply_to_email || !resend_api_key) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: domain_name, from_name, from_email, reply_to_email, resend_api_key'
            });
        }
        // Validação de formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(from_email) || !emailRegex.test(reply_to_email)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de email inválido'
            });
        }
        // Inserir novo domínio
        const { data: newDomain, error } = await supabaseAdmin
            .from('email_domains')
            .insert([{
                domain_name,
                from_name,
                from_email,
                reply_to_email,
                resend_api_key,
                is_active,
                is_default: false, // Novos domínios nunca são padrão
                created_by: req.user?.id || null // Do middleware de autenticação
            }])
            .select()
            .single();
        if (error) {
            console.error('[Admin API] Error creating email domain:', error);
            if (error.code === '23505') { // Unique constraint violation
                return res.status(409).json({
                    success: false,
                    error: 'Domínio já existe',
                    details: error.message
                });
            }
            return res.status(500).json({
                success: false,
                error: 'Erro ao criar domínio',
                details: error.message
            });
        }
        console.log(`✅ [Admin API] Novo domínio criado: ${newDomain.domain_name}`);
        res.status(201).json({
            success: true,
            domain: newDomain
        });
    }
    catch (err) {
        console.error('[Admin API] Exception in email-domains POST:', err.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno',
            details: err.message
        });
    }
});
/**
 * PUT /api/admin/email-domains/:id
 * Atualiza um domínio de email existente
 */
adminRouter.put('/email-domains/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { domain_name, from_name, from_email, reply_to_email, resend_api_key, is_active } = req.body;
        // Verificar se o domínio existe
        const { data: existingDomain, error: findError } = await supabaseAdmin
            .from('email_domains')
            .select('*')
            .eq('id', id)
            .single();
        if (findError || !existingDomain) {
            return res.status(404).json({
                success: false,
                error: 'Domínio não encontrado'
            });
        }
        // Não permitir alterar domain_name do domínio padrão
        if (existingDomain.is_default && domain_name !== existingDomain.domain_name) {
            return res.status(400).json({
                success: false,
                error: 'Não é possível alterar o nome do domínio padrão'
            });
        }
        // Preparar dados para atualização (apenas campos fornecidos)
        const updateData = { updated_at: new Date().toISOString() };
        if (domain_name !== undefined)
            updateData.domain_name = domain_name;
        if (from_name !== undefined)
            updateData.from_name = from_name;
        if (from_email !== undefined)
            updateData.from_email = from_email;
        if (reply_to_email !== undefined)
            updateData.reply_to_email = reply_to_email;
        if (resend_api_key !== undefined)
            updateData.resend_api_key = resend_api_key;
        if (is_active !== undefined)
            updateData.is_active = is_active;
        // Validação de formato de email se fornecidos
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (updateData.from_email && !emailRegex.test(updateData.from_email)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de from_email inválido'
            });
        }
        if (updateData.reply_to_email && !emailRegex.test(updateData.reply_to_email)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de reply_to_email inválido'
            });
        }
        // Atualizar domínio
        const { data: updatedDomain, error: updateError } = await supabaseAdmin
            .from('email_domains')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (updateError) {
            console.error('[Admin API] Error updating email domain:', updateError);
            return res.status(500).json({
                success: false,
                error: 'Erro ao atualizar domínio',
                details: updateError.message
            });
        }
        console.log(`✅ [Admin API] Domínio atualizado: ${updatedDomain.domain_name}`);
        res.json({
            success: true,
            domain: updatedDomain
        });
    }
    catch (err) {
        console.error('[Admin API] Exception in email-domains PUT:', err.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno',
            details: err.message
        });
    }
});
/**
 * DELETE /api/admin/email-domains/:id
 * Remove um domínio de email (exceto o padrão)
 */
adminRouter.delete('/email-domains/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Verificar se o domínio existe e se não é o padrão
        const { data: existingDomain, error: findError } = await supabaseAdmin
            .from('email_domains')
            .select('*')
            .eq('id', id)
            .single();
        if (findError || !existingDomain) {
            return res.status(404).json({
                success: false,
                error: 'Domínio não encontrado'
            });
        }
        // Não permitir deletar domínio padrão
        if (existingDomain.is_default) {
            return res.status(400).json({
                success: false,
                error: 'Não é possível deletar o domínio padrão'
            });
        }
        // Verificar se há campanhas ativas usando este domínio
        // TODO: Implementar verificação de campanhas ativas quando necessário
        // const { data: activeCampaigns } = await supabaseAdmin
        //   .from('lead_campaigns')
        //   .select('id')
        //   .eq('domain_id', id)
        //   .eq('status', 'processing');
        // if (activeCampaigns && activeCampaigns.length > 0) {
        //   return res.status(400).json({
        //     success: false,
        //     error: 'Não é possível deletar domínio com campanhas ativas'
        //   });
        // }
        // Deletar domínio
        const { error: deleteError } = await supabaseAdmin
            .from('email_domains')
            .delete()
            .eq('id', id);
        if (deleteError) {
            console.error('[Admin API] Error deleting email domain:', deleteError);
            return res.status(500).json({
                success: false,
                error: 'Erro ao deletar domínio',
                details: deleteError.message
            });
        }
        console.log(`✅ [Admin API] Domínio deletado: ${existingDomain.domain_name}`);
        res.json({
            success: true,
            message: `Domínio ${existingDomain.domain_name} removido com sucesso`
        });
    }
    catch (err) {
        console.error('[Admin API] Exception in email-domains DELETE:', err.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno',
            details: err.message
        });
    }
});
/**
 * POST /api/admin/email-domains/:id/toggle
 * Ativa/desativa um domínio de email
 */
adminRouter.post('/email-domains/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        if (typeof is_active !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'Campo is_active deve ser boolean'
            });
        }
        // Verificar se o domínio existe
        const { data: existingDomain, error: findError } = await supabaseAdmin
            .from('email_domains')
            .select('*')
            .eq('id', id)
            .single();
        if (findError || !existingDomain) {
            return res.status(404).json({
                success: false,
                error: 'Domínio não encontrado'
            });
        }
        // Não permitir desativar domínio padrão
        if (existingDomain.is_default && !is_active) {
            return res.status(400).json({
                success: false,
                error: 'Não é possível desativar o domínio padrão'
            });
        }
        // Atualizar status
        const { data: updatedDomain, error: updateError } = await supabaseAdmin
            .from('email_domains')
            .update({
            is_active,
            updated_at: new Date().toISOString()
        })
            .eq('id', id)
            .select()
            .single();
        if (updateError) {
            console.error('[Admin API] Error toggling email domain:', updateError);
            return res.status(500).json({
                success: false,
                error: 'Erro ao alterar status do domínio',
                details: updateError.message
            });
        }
        console.log(`✅ [Admin API] Domínio ${updatedDomain.domain_name} ${is_active ? 'ativado' : 'desativado'}`);
        res.json({
            success: true,
            domain: updatedDomain
        });
    }
    catch (err) {
        console.error('[Admin API] Exception in email-domains toggle:', err.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno',
            details: err.message
        });
    }
});
/**
 * POST /api/admin/email-domains/validate-api-key
 * Valida uma API key do Resend
 */
adminRouter.post('/email-domains/validate-api-key', async (req, res) => {
    try {
        const { api_key } = req.body;
        if (!api_key) {
            return res.status(400).json({
                success: false,
                error: 'API key é obrigatória'
            });
        }
        // Importar e usar função de validação
        const { validateResendApiKey } = await import('../lib/emailService');
        const validationResult = await validateResendApiKey(api_key);
        res.json({
            success: true,
            validation: validationResult
        });
    }
    catch (err) {
        console.error('[Admin API] Exception in validate-api-key:', err.message);
        res.status(500).json({
            success: false,
            error: 'Erro ao validar API key',
            details: err.message
        });
    }
});
/**
 * GET /api/admin/email-domains/:id/audit
 * Obtém histórico de auditoria de um domínio
 */
adminRouter.get('/email-domains/:id/audit', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const { data: auditLogs, error } = await supabaseAdmin
            .from('email_domains_audit')
            .select('*')
            .eq('domain_id', id)
            .order('changed_at', { ascending: false })
            .range(Number(offset), Number(offset) + Number(limit) - 1);
        if (error) {
            console.error('[Admin API] Error fetching audit logs:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao buscar logs de auditoria',
                details: error.message
            });
        }
        res.json({
            success: true,
            audit_logs: auditLogs || []
        });
    }
    catch (err) {
        console.error('[Admin API] Exception in audit GET:', err.message);
        res.status(500).json({
            success: false,
            error: 'Erro interno',
            details: err.message
        });
    }
});
export default adminRouter;
