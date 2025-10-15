/**
 * Funções para gerenciar configurações Shopify dos freelancers
 * Shopify é uma integração de e-commerce, não um gateway de pagamento
 */
import { supabaseAdmin } from './server/supabaseAdmin'; // ✅ Backend seguro
/**
 * Busca configuração Shopify de um freelancer
 */
export async function getShopifyConfig(userId) {
    console.log(`[ShopifyConfig] Buscando configuração para usuário: ${userId}`);
    try {
        const { data, error } = await supabaseAdmin
            .from('shopify_configs')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle();
        if (error) {
            console.error(`[ShopifyConfig] Erro ao buscar configuração:`, error);
            return null;
        }
        if (!data) {
            console.log(`[ShopifyConfig] Nenhuma configuração encontrada para usuário: ${userId}`);
            return null;
        }
        console.log(`[ShopifyConfig] Configuração encontrada para: ${data.shop_domain || 'loja não especificada'}`);
        return data;
    }
    catch (error) {
        console.error(`[ShopifyConfig] Erro inesperado:`, error);
        return null;
    }
}
/**
 * Salva ou atualiza configuração Shopify de um freelancer
 */
export async function saveShopifyConfig(userId, webhookSecret, shopDomain) {
    console.log(`[ShopifyConfig] Salvando configuração para usuário: ${userId}`);
    try {
        const { error } = await supabaseAdmin
            .from('shopify_configs')
            .upsert({
            user_id: userId,
            webhook_secret: webhookSecret,
            shop_domain: shopDomain,
            is_active: true,
            updated_at: new Date().toISOString()
        });
        if (error) {
            console.error(`[ShopifyConfig] Erro ao salvar:`, error);
            return false;
        }
        console.log(`[ShopifyConfig] ✅ Configuração salva com sucesso`);
        return true;
    }
    catch (error) {
        console.error(`[ShopifyConfig] Erro inesperado ao salvar:`, error);
        return false;
    }
}
/**
 * Desativa configuração Shopify de um freelancer
 */
export async function deactivateShopifyConfig(userId) {
    try {
        const { error } = await supabaseAdmin
            .from('shopify_configs')
            .update({
            is_active: false,
            updated_at: new Date().toISOString()
        })
            .eq('user_id', userId);
        if (error) {
            console.error(`[ShopifyConfig] Erro ao desativar:`, error);
            return false;
        }
        console.log(`[ShopifyConfig] Configuração desativada para usuário: ${userId}`);
        return true;
    }
    catch (error) {
        console.error(`[ShopifyConfig] Erro inesperado ao desativar:`, error);
        return false;
    }
}
/**
 * Lista todas as configurações Shopify ativas (para admin)
 */
export async function getAllActiveShopifyConfigs() {
    try {
        const { data, error } = await supabaseAdmin
            .from('shopify_configs')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        if (error) {
            console.error(`[ShopifyConfig] Erro ao listar configurações:`, error);
            return [];
        }
        return data || [];
    }
    catch (error) {
        console.error(`[ShopifyConfig] Erro inesperado ao listar:`, error);
        return [];
    }
}
