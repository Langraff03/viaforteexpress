// src/lib/api.ts

import { supabase } from './supabaseClient';

import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Order, OfferEmailLog } from '../types';
import { secureLog } from '../utils/secureLogger';

/**
 * Busca os pedidos aos quais o usuário logado tem acesso.
 * A RLS (Row Level Security) filtra os resultados automaticamente.
 */
export async function getOrders(): Promise<Order[]> {
  try {
    secureLog.debug('Buscando pedidos usando o cliente supabase (com RLS)');
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      secureLog.error('Erro ao buscar pedidos', error);
      throw new Error(error.message);
    }
    
    secureLog.debug(`Encontrados ${data?.length || 0} pedidos`);
    return data ?? [];
  } catch (err: any) {
    secureLog.error('Erro ao buscar pedidos', err);
    return [];
  }
}

/** Subscreve alterações na tabela de pedidos */
export function subscribeToOrders(callback: () => void): () => void {
  const channel: RealtimeChannel = supabase
    .channel('public:orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback);
  channel.subscribe();
  return () => void supabase.removeChannel(channel);
}

/**
 * Busca os logs de e-mail aos quais o usuário logado tem acesso.
 * A RLS (Row Level Security) filtra os resultados automaticamente.
 */
export async function getOfferEmailLogs(): Promise<OfferEmailLog[]> {
  try {
    secureLog.debug('Buscando logs de email de oferta usando o cliente supabase (com RLS)');
    
    const { data, error } = await supabase
      .from('log_offer_emails')
      .select('*')
      .order('sent_at', { ascending: false });
    
    if (error) {
      secureLog.error('Erro ao buscar logs de email de oferta', error);
      throw new Error(error.message);
    }
    
    secureLog.debug(`Encontrados ${data?.length || 0} logs de email de oferta`);
    return (data as OfferEmailLog[] | null) ?? [];
  } catch (err: any) {
    secureLog.error('Erro ao buscar logs de email de oferta', err);
    return [];
  }
}

/** Subscreve alterações na tabela de logs de e-mail */
export function subscribeToOfferEmailLogs(callback: () => void): () => void {
  const channel: RealtimeChannel = supabase
    .channel('public:log_offer_emails')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'log_offer_emails' }, callback);
  channel.subscribe();
  return () => void supabase.removeChannel(channel);
}

/**
 * Cria um novo pedido no banco de dados.
 * A RLS garantirá que client_id e gateway_id sejam preenchidos corretamente.
 */
export async function createOrder(params: Partial<Order>): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(params)
    .select()
    .single();
  if (error) {
    secureLog.error('Erro ao criar pedido', error);
    throw error;
  }
  return data as Order;
}

/** Gera um código de rastreio aleatório de 6 caracteres */
export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/** Gera um código de rastreio único verificando no banco de dados */
export async function generateUniqueTrackingCode(): Promise<string> {
  let code: string;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (exists && attempts < maxAttempts) {
    code = generateTrackingCode();
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('tracking_code', code)
      .single();
    exists = !!data;
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Não foi possível gerar um código de rastreio único');
  }
  
  return code!;
}

/** Gera o link completo de rastreamento */
export function generateTrackingLink(code: string): string {
  return `https://rastreio.viaforteexpress.com/tracking/${code}`;
}

// As funções getEmailSettings e saveEmailSettings foram removidas
// pois a tabela 'email_settings' não existe no novo schema.
// A configuração de email agora pode ser gerenciada por cliente na tabela 'clients' (coluna 'settings').

/** Stub: quick test de envio de email */
export async function testEmailConfiguration(cfg: {
  from_name: string;
  from_email: string;
  reply_to: string;
}): Promise<void> {
  secureLog.debug('Testando configuração de email', cfg);
}

/** Stub: quick test do gateway API key */
export async function testGatewayConfiguration(apiKey: string): Promise<void> {
  secureLog.debug('Testando API Key do gateway');
}

export const api = {
  getOrders,
  subscribeToOrders,
  getOfferEmailLogs,
  subscribeToOfferEmailLogs,
  createOrder,
  generateTrackingCode,
  generateUniqueTrackingCode,
  generateTrackingLink,
  testEmailConfiguration,
  testGatewayConfiguration,
};
