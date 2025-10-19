/**
 * Funções para gerenciar configurações Shopify dos freelancers
 * Shopify é uma integração de e-commerce, não um gateway de pagamento
 */

import { supabaseAdmin } from './server/supabaseAdmin'; // ✅ Backend seguro

export interface ShopifyConfig {
  user_id: string;
  webhook_secret: string;
  shop_domain?: string;
  shop_url?: string;              // NOVO: URL da loja para API Admin
  api_access_token?: string;      // NOVO: Token da API Admin
  auto_fulfill?: boolean;         // NOVO: Ativar fulfillment automático
  tracking_company?: string;      // NOVO: Nome da transportadora
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Busca configuração Shopify de um freelancer
 */
export async function getShopifyConfig(userId: string): Promise<ShopifyConfig | null> {
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
  } catch (error) {
    console.error(`[ShopifyConfig] Erro inesperado:`, error);
    return null;
  }
}

/**
 * Salva ou atualiza configuração Shopify de um freelancer
 */
export async function saveShopifyConfig(
  userId: string,
  webhookSecret: string,
  shopDomain?: string,
  shopUrl?: string,              // NOVO: URL da loja
  apiAccessToken?: string,       // NOVO: Token da API Admin
  autoFulfill?: boolean,         // NOVO: Ativar fulfillment automático
  trackingCompany?: string       // NOVO: Nome da transportadora
): Promise<boolean> {
  console.log(`[ShopifyConfig] Salvando configuração para usuário: ${userId}`);
  
  try {
    const configData: any = {
      user_id: userId,
      webhook_secret: webhookSecret,
      shop_domain: shopDomain,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    // Adicionar campos opcionais apenas se fornecidos
    if (shopUrl !== undefined) configData.shop_url = shopUrl;
    if (apiAccessToken !== undefined) configData.api_access_token = apiAccessToken;
    if (autoFulfill !== undefined) configData.auto_fulfill = autoFulfill;
    if (trackingCompany !== undefined) configData.tracking_company = trackingCompany;

    const { error } = await supabaseAdmin
      .from('shopify_configs')
      .upsert(configData);

    if (error) {
      console.error(`[ShopifyConfig] Erro ao salvar:`, error);
      return false;
    }

    console.log(`[ShopifyConfig] ✅ Configuração salva com sucesso`);
    if (shopUrl) console.log(`[ShopifyConfig] - Loja: ${shopUrl}`);
    if (autoFulfill !== undefined) console.log(`[ShopifyConfig] - Auto-fulfill: ${autoFulfill}`);
    
    return true;
  } catch (error) {
    console.error(`[ShopifyConfig] Erro inesperado ao salvar:`, error);
    return false;
  }
}

/**
 * Desativa configuração Shopify de um freelancer
 */
export async function deactivateShopifyConfig(userId: string): Promise<boolean> {
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
  } catch (error) {
    console.error(`[ShopifyConfig] Erro inesperado ao desativar:`, error);
    return false;
  }
}

/**
 * Lista todas as configurações Shopify ativas (para admin)
 */
export async function getAllActiveShopifyConfigs(): Promise<ShopifyConfig[]> {
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
  } catch (error) {
    console.error(`[ShopifyConfig] Erro inesperado ao listar:`, error);
    return [];
  }
}