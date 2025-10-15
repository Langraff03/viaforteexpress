// src/routes/leadCampaignRoutes.ts
import express from 'express';
import path from 'path';
import fs from 'fs';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro
import { queueExternalLeadProcessing } from '../lib/queue';
const router = express.Router();
/**
 * POST /api/lead-campaigns
 * Cria uma nova campanha de leads
 */
router.post('/', async (req, res) => {
    try {
        console.log('📤 [API] Recebendo nova campanha de leads...');
        const { campaign, leads, fileName } = req.body;
        // Validar dados obrigatórios
        if (!campaign || !leads || !Array.isArray(leads)) {
            return res.status(400).json({
                success: false,
                error: 'Configuração da campanha e array de leads são obrigatórios'
            });
        }
        // Validar configuração obrigatória
        if (!campaign.name || !campaign.oferta_nome || !campaign.link_da_oferta) {
            return res.status(400).json({
                success: false,
                error: 'Nome da campanha, nome da oferta e link são obrigatórios'
            });
        }
        // Validar leads e contar válidos
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validLeads = leads.filter((lead) => {
            return lead.email && emailRegex.test(lead.email);
        });
        console.log(`📊 [API] Dados processados: ${validLeads.length} leads válidos de ${leads.length} totais`);
        // Obter ID do usuário (usando UUID padrão para teste)  
        const clientId = campaign.client_id || req.headers['client-id'] || '0ec3137d-ee68-4aba-82de-143b3c61516a';
        console.log('🔍 [API] Debug - clientId:', clientId);
        console.log('🔍 [API] Debug - campaign.client_id:', campaign.client_id);
        console.log('🔍 [API] Debug - headers client-id:', req.headers['client-id']);
        if (!clientId) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não autenticado'
            });
        }
        // Salvar arquivo JSON temporariamente para auditoria (opcional)
        const uploadDir = path.join(process.cwd(), 'uploads', 'lead-campaigns');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const tempFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${fileName || 'leads.json'}`;
        const tempFilePath = path.join(uploadDir, tempFileName);
        try {
            fs.writeFileSync(tempFilePath, JSON.stringify(leads, null, 2));
        }
        catch (fileError) {
            console.warn('⚠️ [API] Aviso: Não foi possível salvar arquivo temporário:', fileError);
        }
        // Criar registro da campanha no banco
        const insertData = {
            name: campaign.name,
            client_id: clientId,
            file_name: fileName || 'leads.json',
            file_path: tempFilePath,
            total_leads: leads.length,
            valid_leads: validLeads.length,
            status: 'pending',
            oferta_config: {
                oferta_nome: campaign.oferta_nome,
                desconto: campaign.desconto,
                link_da_oferta: campaign.link_da_oferta,
                descricao_adicional: campaign.descricao_adicional,
                email_template: campaign.email_template // Template personalizado
            }
        };
        console.log('🔍 [API] Debug - Dados para inserir:', JSON.stringify(insertData, null, 2));
        const { data: campaignRecord, error: dbError } = await supabaseAdmin
            .from('lead_campaigns')
            .insert(insertData)
            .select()
            .single();
        if (dbError) {
            console.error('❌ [API] Erro detalhado ao salvar campanha:', {
                error: dbError,
                code: dbError.code,
                message: dbError.message,
                details: dbError.details,
                hint: dbError.hint
            });
            return res.status(500).json({
                success: false,
                error: `Erro ao salvar campanha no banco: ${dbError.message}`,
                details: dbError.details,
                code: dbError.code
            });
        }
        console.log('✅ [API] Campanha salva com sucesso:', campaignRecord);
        // Enfileirar processamento dos leads
        try {
            const job = await queueExternalLeadProcessing({
                clientId,
                fileId: campaignRecord.id,
                leads: validLeads,
                ofertaConfig: {
                    oferta_nome: campaign.oferta_nome,
                    desconto: campaign.desconto,
                    link_da_oferta: campaign.link_da_oferta,
                    descricao_adicional: campaign.descricao_adicional,
                    email_template: campaign.email_template, // Passar template para worker
                    domain_id: campaign.domain_id // ✅ CORREÇÃO: Passar domain_id para worker
                }
            });
            // Atualizar status da campanha para 'processing'
            await supabaseAdmin
                .from('lead_campaigns')
                .update({
                status: 'processing',
                started_at: new Date().toISOString()
            })
                .eq('id', campaignRecord.id);
            console.log(`✅ [API] Campanha ${campaignRecord.id} iniciada com job ${job.id}`);
            res.json({
                success: true,
                campaign: {
                    id: campaignRecord.id,
                    name: campaignRecord.name,
                    totalLeads: leads.length,
                    validLeads: validLeads.length,
                    status: 'processing',
                    jobId: job.id
                }
            });
        }
        catch (queueError) {
            console.error('❌ [API] Erro ao enfileirar processamento:', queueError);
            // Atualizar campanha como falha
            await supabaseAdmin
                .from('lead_campaigns')
                .update({
                status: 'failed',
                error_message: 'Erro ao iniciar processamento'
            })
                .eq('id', campaignRecord.id);
            return res.status(500).json({
                success: false,
                error: 'Erro ao iniciar processamento da campanha'
            });
        }
    }
    catch (error) {
        console.error('❌ [API] Erro geral:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
/**
 * GET /api/lead-campaigns
 * Lista campanhas do usuário
 */
router.get('/', async (req, res) => {
    try {
        const clientId = req.headers['client-id'] || '0ec3137d-ee68-4aba-82de-143b3c61516a';
        const { data: campaigns, error } = await supabaseAdmin
            .from('lead_campaigns')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('❌ [API] Erro ao buscar campanhas:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao buscar campanhas'
            });
        }
        res.json({
            success: true,
            campaigns: campaigns || []
        });
    }
    catch (error) {
        console.error('❌ [API] Erro geral:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});
export default router;
//# sourceMappingURL=leadCampaignRoutes.js.map