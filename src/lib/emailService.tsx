// src/lib/emailService.tsx

import { Resend } from 'resend';
import { renderAsync } from '@react-email/render';
import { supabaseAdmin } from './server/supabaseAdmin'; // ✅ Backend seguro para workers
import TrackingEmail from '../emails/TrackingEmail.backend';
import OfferEmail from '../emails/OfferEmail.backend';
import type { EmailDomain, ExtendedEmailConfig, ValidationResponse } from '../types';

export type EmailConfig = {
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  resendApiKey: string;
};

// Função helper para obter variáveis de ambiente de forma compatível
function getEnvVar(name: string): string | undefined {
  // Se estivermos no Node.js (backend/workers) - sempre primeiro
  if (typeof process !== 'undefined' && process.env) {
    return process.env[`VITE_${name}`] || process.env[name];
  }
  // Se estivermos no browser (frontend) - fallback
  if (typeof window !== 'undefined' && import.meta?.env) {
    return import.meta.env[`VITE_${name}`];
  }
  return undefined;
}

export async function getEmailConfig(): Promise<EmailConfig> {
  console.log('🔧 [getEmailConfig] Lendo variáveis de ambiente:');
  console.log('  FROM_NAME:', getEnvVar('FROM_NAME'));
  console.log('  FROM_EMAIL:', getEnvVar('FROM_EMAIL'));
  console.log('  SUPPORT_EMAIL:', getEnvVar('SUPPORT_EMAIL'));

  try {
    // Tenta buscar configurações do banco de dados
    const { data, error } = await supabaseAdmin
      .from('configurations')
      .select('from_name, from_email, reply_to_email, resend_api_key')
      .maybeSingle();

    // Se ocorrer um erro porque a tabela não existe, use as variáveis de ambiente
    if (error && error.code === '42P01') {
      console.log('Tabela configurations não existe, usando variáveis de ambiente');
      return {
        fromName: getEnvVar('FROM_NAME') || 'VIA FORTE EXPRESS',
        fromEmail: getEnvVar('FROM_EMAIL') || 'contato@viaforteexpress.com',
        replyToEmail: getEnvVar('SUPPORT_EMAIL') || 'suporte@viaforteexpress.com',
        resendApiKey: getEnvVar('RESEND_API_KEY') || '',
      };
    } else if (error) {
      console.error('Erro ao buscar configurações:', error);
      // Para outros erros, ainda tentamos usar as variáveis de ambiente
      return {
        fromName: getEnvVar('FROM_NAME') || 'VIA FORTE EXPRESS',
        fromEmail: getEnvVar('FROM_EMAIL') || 'contato@viaforteexpress.com',
        replyToEmail: getEnvVar('SUPPORT_EMAIL') || 'suporte@viaforteexpress.com',
        resendApiKey: getEnvVar('RESEND_API_KEY') || '',
      };
    }

    // Se não houver erro, use os dados do banco ou fallback para variáveis de ambiente
    return {
      fromName: data?.from_name || getEnvVar('FROM_NAME') || 'VIA FORTE EXPRESS',
      fromEmail: data?.from_email || getEnvVar('FROM_EMAIL') || 'contato@viaforteexpress.com',
      replyToEmail: data?.reply_to_email || getEnvVar('SUPPORT_EMAIL') || 'suporte@viaforteexpress.com',
      resendApiKey: data?.resend_api_key || getEnvVar('RESEND_API_KEY') || '',
    };
  } catch (err) {
    console.error('Erro ao obter configurações de email:', err);
    // Em caso de exceção, ainda tentamos usar as variáveis de ambiente
    return {
      fromName: getEnvVar('FROM_NAME') || 'VIA FORTE EXPRESS',
      fromEmail: getEnvVar('FROM_EMAIL') || 'contato@viaforteexpress.com',
      replyToEmail: getEnvVar('SUPPORT_EMAIL') || 'suporte@viaforteexpress.com',
      resendApiKey: getEnvVar('RESEND_API_KEY') || '',
    };
  }
}

// ==================== SISTEMA MULTI-DOMÍNIO EMAIL ====================

/**
 * Obtém configuração de email por domínio específico
 * @param domainId UUID do domínio na tabela email_domains
 * @returns Promise<EmailConfig> Configuração do email (com fallback automático)
 */
export async function getEmailConfigByDomain(domainId?: string): Promise<EmailConfig> {
  console.log(`🔧 [getEmailConfigByDomain] Buscando configuração para domínio: ${domainId || 'padrão'}`);
  
  // Se não forneceu domainId, usar configuração padrão
  if (!domainId) {
    console.log(`📧 [getEmailConfigByDomain] Nenhum domainId fornecido, usando configuração padrão`);
    return getEmailConfig();
  }

  try {
    // Buscar domínio específico na nova tabela
    const { data: domain, error } = await supabaseAdmin
      .from('email_domains')
      .select('*')
      .eq('id', domainId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error(`❌ [getEmailConfigByDomain] Erro ao buscar domínio ${domainId}:`, error);
      console.log(`📧 [getEmailConfigByDomain] Fallback para configuração padrão devido ao erro`);
      return getEmailConfig();
    }

    if (!domain) {
      console.warn(`⚠️ [getEmailConfigByDomain] Domínio ${domainId} não encontrado ou inativo`);
      console.log(`📧 [getEmailConfigByDomain] Fallback para configuração padrão - domínio não encontrado`);
      return getEmailConfig();
    }

    // Validar se o domínio tem todos os campos obrigatórios
    if (!domain.from_email || !domain.from_name || !domain.resend_api_key) {
      console.error(`❌ [getEmailConfigByDomain] Domínio ${domainId} com campos obrigatórios ausentes:`, {
        from_email: !!domain.from_email,
        from_name: !!domain.from_name,
        resend_api_key: !!domain.resend_api_key
      });
      console.log(`📧 [getEmailConfigByDomain] Fallback para configuração padrão - campos ausentes`);
      return getEmailConfig();
    }

    // Retornar configuração do domínio personalizado
    console.log(`✅ [getEmailConfigByDomain] Configuração encontrada para domínio: ${domain.domain_name}`);
    return {
      fromName: domain.from_name,
      fromEmail: domain.from_email,
      replyToEmail: domain.reply_to_email,
      resendApiKey: domain.resend_api_key,
    };
  } catch (err) {
    console.error(`❌ [getEmailConfigByDomain] Exceção ao buscar domínio ${domainId}:`, err);
    console.log(`📧 [getEmailConfigByDomain] Fallback para configuração padrão devido à exceção`);
    return getEmailConfig();
  }
}

/**
 * Lista todos os domínios ativos disponíveis para seleção
 * @returns Promise<EmailDomain[]> Lista de domínios ativos
 */
export async function getAvailableEmailDomains(): Promise<EmailDomain[]> {
  try {
    const { data: domains, error } = await supabaseAdmin
      .from('email_domains')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('domain_name');

    if (error) {
      console.error(`❌ [getAvailableEmailDomains] Erro ao buscar domínios:`, error);
      return [];
    }

    return domains || [];
  } catch (err) {
    console.error(`❌ [getAvailableEmailDomains] Exceção:`, err);
    return [];
  }
}

/**
 * Obtém o domínio padrão (viaforteexpress.com)
 * @returns Promise<EmailDomain | null> Domínio padrão ou null se não encontrado
 */
export async function getDefaultEmailDomain(): Promise<EmailDomain | null> {
  try {
    const { data: domain, error } = await supabaseAdmin
      .from('email_domains')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error || !domain) {
      console.warn(`⚠️ [getDefaultEmailDomain] Domínio padrão não encontrado:`, error);
      return null;
    }

    return domain;
  } catch (err) {
    console.error(`❌ [getDefaultEmailDomain] Exceção:`, err);
    return null;
  }
}

/**
 * Valida uma API key do Resend
 * @param apiKey Chave da API para validar
 * @returns Promise<ValidationResponse> Resultado da validação
 */
export async function validateResendApiKey(apiKey: string): Promise<ValidationResponse> {
  try {
    const resend = new Resend(apiKey);
    
    // Tenta fazer uma chamada simples para validar a API key
    const response = await resend.emails.send({
      from: 'test@example.com',
      to: 'test@example.com',
      subject: 'Test validation',
      html: '<p>Test</p>',
    });

    // Se chegou até aqui sem erro, a API key é válida
    // (mesmo que o email não seja enviado por outros motivos)
    return {
      valid: true,
      details: response
    };
  } catch (error: any) {
    // Se o erro for especificamente sobre API key inválida
    if (error?.message?.includes('API key') || error?.message?.includes('Unauthorized')) {
      return {
        valid: false,
        error: 'API key inválida',
        details: error
      };
    }

    // Para outros tipos de erro, consideramos que a API key pode estar válida
    // mas há outros problemas (domínio não verificado, etc.)
    return {
      valid: true,
      error: 'API key válida, mas há outros problemas: ' + error?.message,
      details: error
    };
  }
}

export async function testEmailConfiguration(config: {
  fromName: string;
  fromEmail: string;
  resendApiKey: string;
}): Promise<void> {
  if (!config.resendApiKey) {
    throw new Error('Resend API Key obrigatória para teste');
  }

  const resend = new Resend(config.resendApiKey);
  const response = await resend.emails.send({
    from: `${config.fromName} <${config.fromEmail}>`,
    to: [config.fromEmail],
    subject: '🧪 Teste de Configuração - VIA FORTE EXPRESS',
    html: `<p>Se você recebeu este e-mail, sua configuração do Resend está correta!</p>`,
  });

  if (response.error || !response.data) {
    console.error('❌ Erro no email de teste:', response.error);
    throw response.error || new Error('Dados de resposta inviáveis');
  }

  console.log('✅ Email de teste enviado:', response.data.id);
}

export async function sendTrackingEmail(order: {
  id: string;
  tracking_code: string;
  customer_name: string;
  customer_email: string;
  status: string;
}, invoicePdfPath?: string) {
  try {
    // 🔒 PROTEÇÃO: sendTrackingEmail SEMPRE usa getEmailConfig() padrão
    // NUNCA deve usar getEmailConfigByDomain() - isso protege os emails de rastreio
    const config = await getEmailConfig();
    if (!config.resendApiKey) {
      throw new Error('Resend API Key não encontrada');
    }

    const resend = new Resend(config.resendApiKey);

    const html = await renderAsync(
      <TrackingEmail
        name={order.customer_name}
        trackingCode={order.tracking_code}
        orderId={order.id}
      />
    );

    console.log(`📧 Enviando email para ${order.customer_email}`);

    // Preparar opções de email
    const emailOptions: any = {
      from: `${config.fromName} <${config.fromEmail}>`,
      to: [order.customer_email],
      replyTo: config.replyToEmail,
      subject: `📦 Pedido ${order.tracking_code} - VIA FORTE EXPRESS`,
      html,
    };

    // Adicionar anexo da nota fiscal se o caminho for fornecido
    // Nota: No frontend, o anexo de arquivos deve ser tratado diferentemente
    if (invoicePdfPath) {
      console.log(`📎 Anexo de nota fiscal solicitado: ${invoicePdfPath}`);
      console.warn(`⚠️ Anexo de arquivo no frontend não suportado - deve ser processado no backend`);
    }

    const response = await resend.emails.send(emailOptions);

    if (response.error || !response.data) {
      console.error('❌ Erro ao enviar email:', response.error);
      throw response.error || new Error('Dados de resposta inviáveis');
    }

    const messageId = response.data.id;

    // Grava log no Supabase
    await supabaseAdmin.from('email_logs').insert({
      order_id: order.id,
      type: 'tracking',
      status: 'sent',
      recipient_email: order.customer_email,
      sent_at: new Date().toISOString(),
      message_id: messageId,
      has_invoice: !!invoicePdfPath,
    });

    console.log('✅ Email enviado:', messageId);
    return { success: true, id: messageId };
  } catch (err) {
    console.error('❌ Erro ao enviar email:', err);
    throw err;
  }
}

/**
 * Envia um email de oferta para um lead
 * ✅ ATUALIZADO: Agora aceita domainId opcional para usar domínios personalizados
 */
export async function sendOfferEmail(lead: {
  id?: string;
  nome: string;
  email: string;
  oferta_interesse?: string;
  oferta_nome: string;
  desconto?: string;
  link_da_oferta: string;
  descricao_adicional?: string;
  origem?: string; // 'interno' ou 'externo'
  cliente_id?: string; // ID do cliente que enviou o lead (se for externo)
}, domainId?: string) { // ✅ NOVO PARÂMETRO OPCIONAL
  try {
    // ✅ USAR NOVA FUNÇÃO COM SUPORTE A DOMÍNIO PERSONALIZADO
    const config = await getEmailConfigByDomain(domainId);
    
    console.log(`📧 [sendOfferEmail] Usando configuração: ${config.fromName} <${config.fromEmail}> ${domainId ? `(domínio: ${domainId})` : '(padrão)'}`);
    
    if (!config.resendApiKey) {
      throw new Error('Resend API Key não encontrada');
    }

    const resend = new Resend(config.resendApiKey);

    const html = await renderAsync(
      <OfferEmail
        name={lead.nome}
        productName={lead.oferta_nome}
        productDescription={lead.descricao_adicional || 'Produto de alta qualidade'}
        price={lead.desconto ? (parseFloat(lead.desconto) * 1.5).toFixed(2) : '99.90'}
        discountPrice={lead.desconto || '49.90'}
        productImage={''}
        ctaUrl={lead.link_da_oferta}
        unsubscribeUrl={`${process.env.APP_URL || 'https://viaforteexpress.com'}/unsubscribe`}
      />
    );

    console.log(`📧 Enviando email de oferta para ${lead.email}`);

    const response = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: [lead.email],
      replyTo: config.replyToEmail,
      subject: `🔥 Oferta especial: ${lead.oferta_nome} - ${config.fromName}`,
      html,
    });

    if (response.error || !response.data) {
      console.error('❌ Erro ao enviar email de oferta:', response.error);
      throw response.error || new Error('Dados de resposta inviáveis');
    }

    const messageId = response.data.id;

    // Grava log no Supabase
    await supabaseAdmin.from('offer_email_logs').insert({
      lead_id: lead.id,
      type: 'offer',
      status: 'sent',
      recipient_email: lead.email,
      sent_at: new Date().toISOString(),
      message_id: messageId,
      offer_name: lead.oferta_nome,
      origin: lead.origem || 'interno',
      client_id: lead.cliente_id
    });

    console.log('✅ Email de oferta enviado:', messageId);
    return { success: true, id: messageId };
  } catch (err) {
    console.error('❌ Erro ao enviar email de oferta:', err);
    throw err;
  }
}
