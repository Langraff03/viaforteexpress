"use strict";
// src/scripts/send-test-lead-email.js
require('dotenv').config();
const { Resend } = require('resend');
// Configurações do email
const fromName = process.env.FROM_NAME || 'VIA FORTE EXPRESS';
const fromEmail = process.env.FROM_EMAIL || 'contato@viaforteexpress.com';
const replyToEmail = process.env.SUPPORT_EMAIL || 'suporte@viaforteexpress.com';
const resendApiKey = process.env.RESEND_API_KEY;
// Email do destinatário
const toEmail = 'lucaslangrafff@gmail.com';
// Função para enviar email
async function sendTestEmail() {
    if (!resendApiKey) {
        console.error('❌ Erro: RESEND_API_KEY não encontrada no arquivo .env');
        process.exit(1);
    }
    try {
        console.log(`📧 Enviando email de teste para ${toEmail}...`);
        const resend = new Resend(resendApiKey);
        // HTML do email
        const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Oferta Especial</title>
      </head>
      <body style="margin:0;padding:0;background:#f6f9fc;font-family:Segoe UI,Tahoma,Geneva,Arial,sans-serif;line-height:1.6;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:40px 20px;text-align:center;">
            <h1 style="color:#fff;font-size:32px;margin:0;text-transform:uppercase;letter-spacing:2px;">VIA FORTE EXPRESS</h1>
            <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:16px;">Oferta Especial</p>
          </div>
          <div style="padding:40px 30px;">
            <h2 style="color:#1f2937;font-size:24px;margin:0 0 20px;">Olá, Lucas! 👋</h2>
            <p style="color:#4b5563;margin-bottom:30px;font-size:16px;">
              Temos uma oferta especial para você! Aproveite agora com 15% de desconto.
            </p>
            
            <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:25px;text-align:center;margin:30px 0;">
              <p style="color:#6b7280;margin:0 0 10px;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Oferta Especial</p>
              <div style="font-size:32px;color:#4f46e5;font-weight:bold;letter-spacing:3px;margin:10px 0;">15% OFF</div>
            </div>
            
            <div style="text-align:center;margin:35px 0;">
              <a href="https://rastreio.viaforteexpress.com/ofertas/teste" style="display:inline-block;background:#4f46e5;color:#fff;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
                Aproveitar Oferta
              </a>
            </div>
            
            <p style="color:#4b5563;margin-bottom:30px;font-size:16px;">
              Este é um email de teste para verificar o funcionamento do sistema de envio de ofertas.
            </p>
          </div>
          <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:30px;text-align:center;">
            <p style="color:#6b7280;margin:0 0 10px;font-size:14px;">
              Precisa de ajuda? Entre em contato: 
              <a href="mailto:${replyToEmail}" style="color:#4f46e5;text-decoration:none;">${replyToEmail}</a>
            </p>
            <p style="color:#9ca3af;margin:20px 0 0;font-size:12px;">
              © ${new Date().getFullYear()} VIA FORTE EXPRESS • Todos os direitos reservados
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
        // Enviar email
        const response = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [toEmail],
            replyTo: replyToEmail,
            subject: '🔥 Oferta especial: 15% de desconto - VIA FORTE EXPRESS',
            html,
        });
        if (response.error || !response.data) {
            console.error('❌ Erro ao enviar email:', response.error);
            throw response.error || new Error('Dados de resposta inviáveis');
        }
        console.log('✅ Email enviado com sucesso! ID:', response.data.id);
    }
    catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        process.exit(1);
    }
}
// Executar a função
sendTestEmail();
