import React, { useState, useEffect } from 'react';
import {
  Store,
  Copy,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Package,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

export default function FreelancerShopifyConfig() {
  const { user } = useAuth();
  
  // Estados para webhook
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  
  // Estados para processamento automático
  const [shopUrl, setShopUrl] = useState('');
  const [apiAccessToken, setApiAccessToken] = useState('');
  const [showApiToken, setShowApiToken] = useState(false);
  const [autoFulfill, setAutoFulfill] = useState(true);
  const [trackingCompany, setTrackingCompany] = useState('Custom');
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Estados de UI
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const webhookUrl = `${import.meta.env.VITE_WEBHOOK_SERVER_URL || 'http://localhost:3001'}/webhook/shopify?client_id=${user?.id}`;

  useEffect(() => {
    if (!user?.id) return;
    
    // Buscar configuração salva do webhook Shopify
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('shopify_configs')
          .select('webhook_secret, shop_domain, shop_url, api_access_token, auto_fulfill, tracking_company')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && data) {
          setWebhookSecret(data.webhook_secret || '');
          setShopUrl(data.shop_url || '');
          setApiAccessToken(data.api_access_token || '');
          setAutoFulfill(data.auto_fulfill ?? true);
          setTrackingCompany(data.tracking_company || 'Custom');
        }
      } catch (error) {
        console.error('Erro ao carregar configuração Shopify:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadConfig();
  }, [user?.id]);

  const handleSaveConfig = async () => {
    if (!user?.id || !webhookSecret.trim()) {
      alert('Webhook secret é obrigatório');
      return;
    }

    // Validar campos de fulfillment se ativado
    if (autoFulfill) {
      if (!shopUrl.trim()) {
        alert('URL da loja é obrigatória quando processamento automático está ativado');
        return;
      }
      if (!apiAccessToken.trim()) {
        alert('Token de acesso da API é obrigatório quando processamento automático está ativado');
        return;
      }
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const configData: any = {
        user_id: user.id,
        webhook_secret: webhookSecret.trim(),
        shop_domain: null,
        shop_url: shopUrl.trim() || null,
        api_access_token: apiAccessToken.trim() || null,
        auto_fulfill: autoFulfill,
        tracking_company: trackingCompany,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('shopify_configs')
        .upsert(configData, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-emerald-600">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/freelancer/dashboard"
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Store className="w-8 h-8 text-green-600 mr-3" />
              Configurações Shopify
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure webhook para receber pedidos automaticamente da sua loja Shopify
            </p>
          </div>
        </div>
      </div>

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
              <Store className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-medium text-gray-900">Integração com Shopify</h2>
              <p className="text-sm text-gray-500">
                Conecte sua loja Shopify para automatizar o processo de rastreamento
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* URL do Webhook */}
          <div>
            <label className="block text-base font-medium text-gray-900 mb-3">
              1. URL do Webhook
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl)}
                className="px-4 py-3 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              📋 Cole esta URL na configuração de webhook da sua loja Shopify
            </p>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-base font-medium text-gray-900 mb-3">
              2. Webhook Secret da Shopify
            </label>
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Cole aqui o webhook secret da sua loja Shopify"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showSecret ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={isSaving || !webhookSecret.trim()}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Salvo!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              🔑 Copie o webhook secret do painel da Shopify e cole aqui
            </p>
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-300 my-8"></div>

          {/* Seção: Processamento Automático */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Package className="w-6 h-6 text-purple-600 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-purple-900">
                    📦 Processamento Automático de Pedidos
                  </h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Crie fulfillments automaticamente na Shopify e envie emails oficiais da loja
                  </p>
                </div>
              </div>
            </div>

            {/* Toggle Auto-Fulfill */}
            <div className="flex items-center mb-6 p-4 bg-white rounded-lg border border-purple-200">
              <input
                type="checkbox"
                id="autoFulfill"
                checked={autoFulfill}
                onChange={(e) => setAutoFulfill(e.target.checked)}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="autoFulfill" className="ml-3 text-sm font-medium text-gray-900">
                Ativar processamento automático na Shopify
              </label>
            </div>

            {autoFulfill && (
              <div className="space-y-6">
                {/* Campo: URL da Loja */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    3. URL da Loja Shopify
                  </label>
                  <input
                    type="text"
                    value={shopUrl}
                    onChange={(e) => setShopUrl(e.target.value)}
                    placeholder="minhaloja.myshopify.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    🏪 Exemplo: minhaloja.myshopify.com (sem https://)
                  </p>
                </div>

                {/* Campo: Token API */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    4. Token de Acesso da API Admin
                  </label>
                  <div className="relative">
                    <input
                      type={showApiToken ? 'text' : 'password'}
                      value={apiAccessToken}
                      onChange={(e) => setApiAccessToken(e.target.value)}
                      placeholder="shpat_..."
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiToken(!showApiToken)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showApiToken ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    🔑 Token gerado no painel de Apps da Shopify
                  </p>
                </div>

                {/* Campo: Transportadora */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    5. Nome da Transportadora
                  </label>
                  <select
                    value={trackingCompany}
                    onChange={(e) => setTrackingCompany(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Custom">Personalizado</option>
                    <option value="Correios">Correios</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                    <option value="UPS">UPS</option>
                  </select>
                  <p className="mt-2 text-sm text-gray-600">
                    🚚 Nome que aparecerá no email da Shopify
                  </p>
                </div>

                {/* Instruções Expandíveis */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg">
                  <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="text-sm font-medium text-orange-900">
                      🔧 Como obter o Token de Acesso da API Admin?
                    </span>
                    {showInstructions ? (
                      <ChevronUp className="w-5 h-5 text-orange-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-orange-600" />
                    )}
                  </button>
                  
                  {showInstructions && (
                    <div className="px-4 pb-4">
                      <ol className="text-sm text-orange-800 space-y-2 list-decimal list-inside">
                        <li>Acesse sua conta da Shopify</li>
                        <li>No menu lateral, clique em <strong>Configurações</strong></li>
                        <li>Depois clique em <strong>Apps e canais de vendas</strong></li>
                        <li>Clique em <strong>Desenvolver apps</strong></li>
                        <li>Depois em <strong>Criar um app</strong></li>
                        <li>Informe um título (ex: <em>Integração Rastreamento</em>)</li>
                        <li>Em <em>Desenvolvedor do app</em> mantenha seu e-mail</li>
                        <li>Clique em <strong>Criar APP</strong></li>
                        <li>Clique no botão <strong>Configurar escopos da API Admin</strong></li>
                        <li className="font-bold">Selecione as permissões necessárias:</li>
                        <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
                          <li>✓ read_orders</li>
                          <li>✓ write_orders</li>
                          <li>✓ read_order_edits</li>
                          <li>✓ write_order_edits</li>
                          <li>✓ write_merchant_managed_fulfillment_orders</li>
                          <li>✓ read_merchant_managed_fulfillment_orders</li>
                          <li className="font-bold">✓ write_fulfillments (CRÍTICO)</li>
                        </ul>
                        <li>Após selecionar, clique em <strong>Salvar</strong></li>
                        <li>Clique em <strong>Credenciais da API</strong> e depois em <strong>Instalar APP</strong></li>
                        <li>Será gerado um Token de acesso da API Admin</li>
                        <li>Clique em <strong>Revelar token uma vez</strong> e copie o token</li>
                        <li>Cole o token no campo acima e clique em <strong>Salvar Tudo</strong></li>
                      </ol>
                    </div>
                  )}
                </div>

                {/* Aviso Importante */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">
                        Como funciona o processamento automático:
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>✅ Cliente compra na sua loja Shopify</li>
                        <li>✅ Sistema recebe webhook e gera código de rastreamento</li>
                        <li>✅ Sistema envia email personalizado de rastreamento</li>
                        <li>✅ Sistema cria fulfillment na Shopify automaticamente</li>
                        <li>✅ Shopify envia email oficial de confirmação de envio</li>
                        <li>✅ Pedido fica marcado como "Enviado" na Shopify</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão Salvar Tudo */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={isSaving || !webhookSecret.trim()}
              className="px-8 py-4 bg-emerald-600 text-white text-lg font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center shadow-lg"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 mr-3 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-3" />
                  Salvo com Sucesso!
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-3" />
                  Salvar Tudo
                </>
              )}
            </button>
          </div>

          {/* Instruções Webhook */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              📋 Como configurar na Shopify:
            </h3>
            <ol className="text-sm text-blue-800 space-y-3 list-decimal list-inside">
              <li><strong>Acesse o painel admin</strong> da sua loja Shopify</li>
              <li>Vá em <strong>Configurações → Notificações</strong></li>
              <li>Na seção <strong>Webhooks</strong>, clique em <strong>Criar webhook</strong></li>
              <li><strong>Evento:</strong> Selecione "Pagamento de pedido" (orders/paid)</li>
              <li><strong>Formato:</strong> JSON</li>
              <li><strong>URL:</strong> Cole a URL acima</li>
              <li>Salve o webhook e <strong>copie o Webhook signing secret</strong></li>
              <li>Cole o secret no campo acima e clique em <strong>Salvar</strong></li>
            </ol>
          </div>

          {/* Status da Configuração */}
          {webhookSecret && shopUrl && apiAccessToken && autoFulfill ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    ✅ Integração Shopify COMPLETA
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Webhook ativo + Processamento automático configurado!
                    Os pedidos serão processados automaticamente e a Shopify enviará emails ao cliente.
                  </p>
                </div>
              </div>
            </div>
          ) : webhookSecret ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    ⚠️ Webhook ativo, processamento automático pendente
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Configure o processamento automático acima para que a Shopify também envie emails de confirmação.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    ❌ Configuração incompleta
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Configure o webhook secret acima para ativar a integração com Shopify.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Informações Técnicas */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              🔧 Informações Técnicas:
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Evento suportado:</strong> orders/paid (Pagamento de pedido)</li>
              <li>• <strong>Formato:</strong> JSON</li>
              <li>• <strong>Validação:</strong> HMAC SHA256 obrigatória</li>
              <li>• <strong>Processamento:</strong> Apenas pedidos com endereço de entrega</li>
              <li>• <strong>Integração:</strong> Funciona junto com gateways existentes (Asset, etc.)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}