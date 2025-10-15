/**
 * Script unificado para criar um pedido de teste no banco de dados
 * e enviar um email com links para rastreio e nota fiscal
 */

require('dotenv').config();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Importar utilitários
// Nota: Como estamos em um ambiente Node.js, precisamos usar require em vez de import
const errorHandlingPath = path.join(__dirname, '../utils/errorHandling.js');
const tokenUtilsPath = path.join(__dirname, '../utils/tokenUtils.js');
const validationPath = path.join(__dirname, '../utils/validation.js');

// Usar require dinâmico para os módulos ESM
async function importESM(modulePath) {
  try {
    // Converter para URL para importação dinâmica
    const moduleURL = `file://${modulePath.replace(/\\/g, '/')}`;
    return await import(moduleURL);
  } catch (error) {
    console.error(`Erro ao importar módulo ${modulePath}:`, error);
    throw error;
  }
}

// Configurações
const EMAIL_TO = 'lucaslangrafff@gmail.com'; // Email específico para o teste
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_NAME = process.env.FROM_NAME || 'VIA FORTE EXPRESS';
const FROM_EMAIL = process.env.FROM_EMAIL || 'contato@viaforteexpress.com';
const BASE_URL = process.env.PUBLIC_URL || process.env.VITE_APP_URL || 'http://localhost:3000';

// Configurações do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar se as chaves de API estão configuradas
if (!RESEND_API_KEY) {
  console.error('❌ Erro: RESEND_API_KEY não configurada no arquivo .env');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Configurações do Supabase não encontradas no arquivo .env');
  process.exit(1);
}

// Inicializar o cliente Resend
const resend = new Resend(RESEND_API_KEY);

// Inicializar o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Função para gerar um código de rastreio simulado
function generateTrackingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TST';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Função para registrar o log de e-mail
async function logEmail(orderId, email, messageId, errorHandling) {
  try {
    // Verificar a estrutura da tabela email_logs
    const columnsQuery = () => supabase.from('email_logs').select('*').limit(1);
    
    const { data: columns, error: columnsError } = errorHandling ? 
      await errorHandling.executeWithRetry(columnsQuery, { maxRetries: 2 }) : 
      await columnsQuery();
      
    if (columnsError) {
      console.warn(`⚠️ Erro ao verificar estrutura da tabela:`, columnsError);
    }
    
    // Criar objeto com dados básicos
    const logData = {
      order_id: orderId,
      recipient_email: email,
      type: 'tracking',
      status: 'sent'
    };
    
    // Adicionar campos opcionais se existirem na tabela
    if (columns && Object.keys(columns[0] || {}).includes('sent_at')) {
      logData.sent_at = new Date().toISOString();
    }
    
    // Inserir log com os campos disponíveis
    const insertQuery = () => supabase.from('email_logs').insert(logData);
    
    const { error } = errorHandling ? 
      await errorHandling.executeWithRetry(insertQuery, { maxRetries: 2 }) : 
      await insertQuery();
      
    if (error) {
      console.warn(`⚠️ Erro ao registrar log de e-mail:`, error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao registrar log de e-mail:', error);
    return false;
  }
}

// Função para gerar o HTML do e-mail com link para a nota fiscal
function generateEmailHtml(trackingCode, invoiceUrl, customerName) {
  const trackingUrl = `${BASE_URL}/tracking/${trackingCode}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rastreamento de Pedido</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f6f9fc;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
        }
        .logo {
          font-size: 42px;
          color: #4f46e5;
          font-weight: bold;
          margin: 0;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          line-height: 1;
        }
        .tracking-box {
          background-color: #f8fafc;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 32px;
          text-align: center;
        }
        .tracking-label {
          font-size: 18px;
          color: #475569;
          margin: 0;
        }
        .tracking-code {
          color: #4f46e5;
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 0.1em;
          display: block;
          margin-top: 8px;
        }
        .greeting {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 24px;
          text-align: center;
        }
        .message {
          font-size: 16px;
          color: #4b5563;
          line-height: 24px;
          margin-bottom: 24px;
          text-align: center;
        }
        .button {
          display: block;
          text-align: center;
          margin: 40px 0;
        }
        .button a {
          background-color: #4f46e5;
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 16px;
          font-weight: bold;
          display: inline-block;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .invoice-link {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          background-color: #f0f9ff;
          border-radius: 8px;
          border: 1px dashed #93c5fd;
        }
        .invoice-link a {
          color: #2563eb;
          font-weight: bold;
          text-decoration: none;
        }
        .invoice-link a:hover {
          text-decoration: underline;
        }
        .invoice-icon {
          font-size: 24px;
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">VIA FORTE EXPRESS</div>
        </div>
        
        <div class="tracking-box">
          <div class="tracking-label">
            Código de Rastreio:
            <span class="tracking-code">${trackingCode}</span>
          </div>
        </div>
        
        <div class="greeting">Olá, ${customerName || 'Cliente'}! 👋</div>
        
        <div class="message">
          Ótimas notícias! 🎉 Seu pedido foi recebido e está sendo processado com todo cuidado pela nossa equipe. 
          Clique no botão abaixo para acompanhar cada etapa da sua entrega em tempo real:
        </div>
        
        <div class="button">
          <a href="${trackingUrl}" target="_blank">Rastrear Pedido</a>
        </div>
        
        <div class="invoice-link">
          <div class="invoice-icon">📄</div>
          <p>Sua nota fiscal está disponível para download:</p>
          <a href="${invoiceUrl}" target="_blank">Visualizar/Baixar Nota Fiscal</a>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Função principal
async function main() {
  let errorHandling, tokenUtils, validation;
  
  try {
    // Importar utilitários
    [errorHandling, tokenUtils, validation] = await Promise.all([
      importESM(errorHandlingPath),
      importESM(tokenUtilsPath),
      importESM(validationPath)
    ]);
    
    console.log('===== Criando Pedido e Enviando Email =====');
    
    // Gerar dados do pedido
    const orderId = uuidv4();
    const trackingCode = generateTrackingCode();
    const customerName = 'Cliente de Teste';
    const customerEmail = EMAIL_TO;
    const amount = 19990; // Valor em centavos (199.90 * 100)
    const paymentId = `pay_${Date.now()}`;
    
    console.log(`📦 ID do pedido: ${orderId}`);
    console.log(`🔢 Código de rastreio: ${trackingCode}`);
    console.log(`👤 Cliente: ${customerName} (${customerEmail})`);
    
    // Buscar um gateway_id válido para associar ao pedido
    const { data: gateway, error: gatewayError } = await errorHandling.executeWithRetry(
      () => supabase.from('gateways').select('id').limit(1).single(),
      { 
        maxRetries: 3,
        shouldRetry: (error) => !error.message.includes('No rows matched') 
      }
    );
      
    if (gatewayError) {
      console.error('❌ Erro ao buscar gateway:', gatewayError);
      throw new Error('Não foi possível encontrar um gateway para associar ao pedido');
    }
    
    const gatewayId = gateway.id;
    console.log(`🔌 Gateway ID: ${gatewayId}`);
    
    // Criar objeto de pedido
    const orderData = {
      id: orderId,
      customer_name: customerName,
      customer_email: customerEmail,
      amount: amount,
      status: 'processing',
      payment_status: 'paid',
      payment_id: paymentId,
      tracking_code: trackingCode,
      gateway_id: gatewayId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Validar dados do pedido
    const validationResult = validation.validateOrder(orderData);
    if (!validationResult.isValid) {
      console.error('❌ Dados do pedido inválidos:', validationResult.errors);
      throw new Error(`Dados do pedido inválidos: ${validationResult.errors.join(', ')}`);
    }
    
    // Criar o pedido no banco de dados com retry
    const { data: order, error: orderError } = await errorHandling.executeWithRetry(
      () => supabase.from('orders').insert(orderData).select().single(),
      { maxRetries: 3 }
    );
      
    if (orderError) {
      console.error('❌ Erro ao criar pedido:', orderError);
      throw orderError;
    }
    
    console.log('✅ Pedido criado com sucesso!');
    
    // Gerar token para a nota fiscal usando o utilitário
    const invoiceToken = tokenUtils.generateInvoiceToken(orderId, trackingCode);
    const invoiceUrl = `${BASE_URL}/invoice/${invoiceToken}`;
    
    console.log('✅ Nota fiscal gerada com sucesso!');
    console.log(`🔗 Link para visualizar a nota fiscal: ${invoiceUrl}`);
    
    // Gerar HTML do e-mail com link para a nota fiscal
    const emailHtml = generateEmailHtml(trackingCode, invoiceUrl, customerName);
    
    // Preparar opções de email
    const emailOptions = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [customerEmail],
      subject: `📦 Pedido ${trackingCode} - VIA FORTE EXPRESS`,
      html: emailHtml,
      text: `Seu código de rastreio é: ${trackingCode}. Acesse sua nota fiscal em: ${invoiceUrl}`
    };
    
    // Validar dados do email
    if (validation) {
      const emailValidationResult = validation.validateEmail(emailOptions);
      if (!emailValidationResult.isValid) {
        console.error('❌ Dados do email inválidos:', emailValidationResult.errors);
        throw new Error(`Dados do email inválidos: ${emailValidationResult.errors.join(', ')}`);
      }
    }
    
    // Enviar e-mail com link para a nota fiscal
    console.log(`📧 Enviando e-mail para ${customerEmail}...`);
    
    // Usar executeWithRetry se disponível
    const sendEmail = () => resend.emails.send(emailOptions);
    
    const response = await errorHandling.executeWithRetry(sendEmail, { 
      maxRetries: 3,
      initialDelay: 2000,
      backoffFactor: 1.5
    });
    
    if (response.error) {
      console.error('❌ Erro ao enviar e-mail:', response.error);
      throw new Error(`Erro ao enviar e-mail: ${response.error.message || JSON.stringify(response.error)}`);
    }
    
    // Registrar o log de e-mail
    const messageId = response?.data?.id || 'unknown';
    const logSuccess = await logEmail(orderId, customerEmail, messageId, errorHandling);
    
    if (logSuccess) {
      console.log(`✅ Log de e-mail registrado com sucesso`);
    }
    
    console.log(`✅ E-mail enviado com sucesso! ID: ${messageId}`);
    console.log('\nVocê pode acessar a nota fiscal em:');
    console.log(`👉 ${invoiceUrl}`);
    console.log('\nOu visualizar o pedido na lista de pedidos em:');
    console.log(`👉 ${BASE_URL}/gateway/orders`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    
    // Se temos o utilitário de tratamento de erros, usar para log detalhado
    if (errorHandling) {
      errorHandling.handleGlobalError(error, 'create-order-and-send-email');
    }
    
    process.exit(1);
  }
}

// Executar a função principal
main();