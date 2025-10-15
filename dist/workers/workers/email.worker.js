// src/workers/email.worker.ts
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { Resend } from 'resend';
import { getEmailConfig, getEmailConfigByDomain } from '../lib/emailService';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro
// Redis connection
const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});
const emailWorker = new Worker('email', async (job) => {
    console.log(`[EmailWorker] Processando job.id=${job.id}`, job.data);
    const { to, subject, context } = job.data;
    // order_id é obrigatório apenas para emails de rastreamento, opcional para campanhas
    if (!context.order_id) {
        console.log(`[EmailWorker] Email sem order_id (campanha) - job.id=${job.id}`);
    }
    // 1) Buscar configurações do Resend com suporte a domínio personalizado
    const domainId = job.data.domain_id; // Domain ID pode vir no payload
    const config = domainId ? await getEmailConfigByDomain(domainId) : await getEmailConfig();
    console.log(`📧 [EmailWorker] Usando configuração: ${config.fromName} <${config.fromEmail}> ${domainId ? `(domínio: ${domainId})` : '(padrão)'}`);
    if (!config.resendApiKey) {
        throw new Error('Chave da API do Resend não encontrada');
    }
    const resend = new Resend(config.resendApiKey);
    // 2) Usar HTML personalizado se fornecido, senão usar template de rastreamento padrão
    let html;
    if (job.data.html) {
        // Usar template personalizado (para campanhas de lead)
        console.log(`[EmailWorker] Usando template HTML personalizado`);
        html = job.data.html;
    }
    else {
        // Usar template de rastreamento padrão (para pedidos)
        console.log(`[EmailWorker] Usando template de rastreamento padrão`);
        html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>🚚 Seu pedido está a caminho! Acompanhe o rastreamento na VIA FORTE EXPRESS</title>
        </head>
        <body style="margin:0;padding:40px 0;background:#f6f9fc;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
          <div style="background:#ffffff;padding:40px;border-radius:12px;max-width:600px;margin:auto;box-shadow:0 4px 6px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
            
            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="font-size:42px;color:#4f46e5;font-weight:bold;margin:0;letter-spacing:-0.025em;font-family:system-ui,-apple-system,sans-serif;text-transform:uppercase;line-height:1;">VIA FORTE EXPRESS</h1>
            </div>
            
            <!-- Código de Rastreio -->
            ${context.trackingCode ? `
            <div style="background:#f8fafc;border-radius:8px;padding:24px;margin-bottom:32px;">
              <div style="font-size:18px;color:#475569;margin:0;text-align:center;">
                Código de Rastreio:
                <br />
                <span style="color:#4f46e5;font-size:24px;font-weight:bold;letter-spacing:0.1em;display:block;margin-top:8px;">
                  ${context.trackingCode}
                </span>
              </div>
            </div>
            ` : ''}
            
            <!-- Saudação -->
            <h2 style="font-size:24px;font-weight:bold;color:#1f2937;margin-bottom:24px;text-align:center;">
              Olá, ${context.customerName || 'Cliente'}! 👋
          </h2>
          
          <!-- Texto principal -->
          <p style="font-size:16px;color:#4b5563;line-height:24px;margin-bottom:24px;text-align:center;">
            Ótimas notícias! 🎉 Seu pedido foi recebido e está sendo processado com todo cuidado pela nossa equipe.
            Clique no botão abaixo para acompanhar cada etapa da sua entrega em tempo real:
          </p>
          
          <!-- Botão de Rastreamento -->
          ${context.trackingUrl ? `
          <div style="text-align:center;margin:40px 0;">
            <a href="${context.trackingUrl}" target="_blank" style="background:#4f46e5;color:#ffffff;padding:14px 24px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;box-shadow:0 2px 4px rgba(79,70,229,0.2);">
              🚚 Rastrear Pedido
            </a>
          </div>
          ` : ''}
          
          <!-- Dica -->
          <div style="background:#f8fafc;border-radius:8px;padding:24px;margin-top:32px;margin-bottom:32px;">
            <p style="font-size:14px;color:#475569;margin:0;text-align:center;line-height:20px;">
              ⚡️ Dica: Salve o link de rastreamento nos favoritos do seu navegador para
              acessar rapidamente as atualizações do seu pedido.
            </p>
          </div>
          
          <!-- Suporte -->
          <p style="font-size:14px;color:#6b7280;line-height:20px;margin-bottom:24px;text-align:center;">
            Precisa de ajuda? Nossa equipe está disponível 24/7 em <a href="mailto:${config.replyToEmail}" style="color:#4f46e5;text-decoration:none;">${config.replyToEmail}</a>
          </p>
          
          <!-- Separador -->
          <hr style="border-top:1px solid #e5e7eb;margin:32px 0;border-left:none;border-right:none;border-bottom:none;" />
          
          <!-- Footer -->
          <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0;line-height:16px;">
            © ${new Date().getFullYear()} VIA FORTE EXPRESS • Todos os direitos reservados
            <br />
            <span style="display:block;margin-top:4px;">
              Av. Goiás, 1234 • Goiânia, GO • 74000-000
            </span>
          </p>
          
        </div>
      </body>
      </html>
    `;
    }
    try {
        // 3) Enviar email via Resend
        const { data, error } = await resend.emails.send({
            from: `${config.fromName} <${config.fromEmail}>`,
            to: [to],
            replyTo: config.replyToEmail,
            subject,
            html,
        });
        if (error || !data) {
            console.error(`[EmailWorker] Erro ao enviar job.id=${job.id}:`, error);
            throw error || new Error('Resposta inválida do Resend');
        }
        const messageId = data.id;
        console.log(`[EmailWorker] Email enviado para ${to} (job.id=${job.id}, messageId=${messageId})`);
        // 4) Tentar registrar log no Supabase, mas não falhar se houver erro
        try {
            // Verificar primeiro se o order_id existe na tabela orders
            const { data: orderExists, error: orderError } = await supabaseAdmin
                .from('orders')
                .select('id')
                .eq('id', context.order_id)
                .maybeSingle();
            if (orderError) {
                console.error(`[EmailWorker] Erro ao verificar existência do pedido ${context.order_id}:`, orderError);
                // Continuar mesmo com erro na verificação
            }
            // Só inserir o log se o pedido existir
            if (orderExists) {
                const { error: logError } = await supabaseAdmin.from('email_logs').insert({
                    order_id: context.order_id,
                    type: 'tracking',
                    status: 'sent',
                    recipient_email: to,
                    sent_at: new Date().toISOString(),
                    // Não incluir message_id se estiver causando erro
                    // message_id: messageId,
                });
                if (logError) {
                    console.error(`[EmailWorker] Falha ao gravar log job.id=${job.id}:`, logError);
                    // Não lançar erro, apenas registrar
                }
                else {
                    console.log(`[EmailWorker] Log gravado com sucesso para order_id=${context.order_id}`);
                }
            }
            else {
                console.warn(`[EmailWorker] Pedido ${context.order_id} não encontrado, log de email não será gravado`);
            }
        }
        catch (logErr) {
            console.error(`[EmailWorker] Falha job.id=${job.id}:`, logErr);
            // Não lançar erro, apenas registrar
        }
        // 5) Atualizar status do pedido para 'pending' após envio bem-sucedido
        try {
            const { error: updateError } = await supabaseAdmin
                .from('orders')
                .update({ status: 'pending' })
                .eq('id', context.order_id);
            if (updateError) {
                console.error(`[EmailWorker] Erro ao atualizar status do pedido ${context.order_id}:`, updateError);
            }
            else {
                console.log(`[EmailWorker] Status do pedido ${context.order_id} atualizado para 'pending'`);
            }
        }
        catch (updateErr) {
            console.error(`[EmailWorker] Falha ao atualizar status do pedido ${context.order_id}:`, updateErr);
        }
        // Retornar sucesso mesmo se o log falhar
        return { success: true, id: messageId };
    }
    catch (err) {
        console.error(`[EmailWorker] Falha job.id=${job.id}:`, err);
        throw err;
    }
}, { connection });
// Event handlers
emailWorker.on('completed', (job) => {
    console.log(`✅ Job de email concluído (job.id=${job?.id})`);
});
emailWorker.on('failed', (job, err) => {
    console.error(`❌ Job de email falhou (job.id=${job?.id}):`, err);
});
export default emailWorker;
//# sourceMappingURL=email.worker.js.map