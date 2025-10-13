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
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

export default function FreelancerShopifyConfig() {
  const { user } = useAuth();
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
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
          .select('webhook_secret, shop_domain')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && data) {
          setWebhookSecret(data.webhook_secret || '');
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
    if (!user?.id || !webhookSecret.trim()) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from('shopify_configs')
        .upsert({
          user_id: user.id,
          webhook_secret: webhookSecret.trim(),
          shop_domain: null, // Pode ser preenchido futuramente se necessário
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id' // ✅ Especificar coluna de conflito
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

          {/* Instruções Detalhadas */}
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
          {webhookSecret ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    ✅ Configuração Shopify ativa
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Seu sistema está pronto para receber pedidos da Shopify automaticamente!
                    Os pedidos aparecerão na sua lista de "Pedidos Recentes" no dashboard.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    ⚠️ Configuração pendente
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
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