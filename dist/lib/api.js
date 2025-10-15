// src/lib/api.ts
import { supabase } from './supabaseClient';
import { secureLog } from '../utils/secureLogger';
/**
 * Busca os pedidos aos quais o usuário logado tem acesso.
 * A RLS (Row Level Security) filtra os resultados automaticamente.
 */
export async function getOrders() {
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
    }
    catch (err) {
        secureLog.error('Erro ao buscar pedidos', err);
        return [];
    }
}
/** Subscreve alterações na tabela de pedidos */
export function subscribeToOrders(callback) {
    const channel = supabase
        .channel('public:orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback);
    channel.subscribe();
    return () => void supabase.removeChannel(channel);
}
/**
 * Busca os logs de e-mail aos quais o usuário logado tem acesso.
 * A RLS (Row Level Security) filtra os resultados automaticamente.
 */
export async function getOfferEmailLogs() {
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
        return data ?? [];
    }
    catch (err) {
        secureLog.error('Erro ao buscar logs de email de oferta', err);
        return [];
    }
}
/** Subscreve alterações na tabela de logs de e-mail */
export function subscribeToOfferEmailLogs(callback) {
    const channel = supabase
        .channel('public:log_offer_emails')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'log_offer_emails' }, callback);
    channel.subscribe();
    return () => void supabase.removeChannel(channel);
}
/**
 * Cria um novo pedido no banco de dados.
 * A RLS garantirá que client_id e gateway_id sejam preenchidos corretamente.
 */
export async function createOrder(params) {
    const { data, error } = await supabase
        .from('orders')
        .insert(params)
        .select()
        .single();
    if (error) {
        secureLog.error('Erro ao criar pedido', error);
        throw error;
    }
    return data;
}
/** Gera um código de rastreio aleatório de 6 caracteres */
export function generateTrackingCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
/** Gera um código de rastreio único verificando no banco de dados */
export async function generateUniqueTrackingCode() {
    let code;
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
    return code;
}
/** Gera o link completo de rastreamento */
export function generateTrackingLink(code) {
    return `https://rastreio.viaforteexpress.com/tracking/${code}`;
}
// As funções getEmailSettings e saveEmailSettings foram removidas
// pois a tabela 'email_settings' não existe no novo schema.
// A configuração de email agora pode ser gerenciada por cliente na tabela 'clients' (coluna 'settings').
/** Stub: quick test de envio de email */
export async function testEmailConfiguration(cfg) {
    secureLog.debug('Testando configuração de email', cfg);
}
/** Stub: quick test do gateway API key */
export async function testGatewayConfiguration(apiKey) {
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
