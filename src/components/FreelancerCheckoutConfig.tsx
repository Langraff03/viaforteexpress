import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Settings,
  Globe,
  Mail,
  Code,
  Plus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from './ui/Card';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';
import type {
  CheckoutConfigFormData,
  FreelancerCheckoutConfig,
  EmailDomainWithOwner,
  DomainRequestFormData
} from '../types/checkout';

interface FreelancerCheckoutConfigProps {
  onConfigUpdate?: () => void;
}

export default function FreelancerCheckoutConfig({ onConfigUpdate }: FreelancerCheckoutConfigProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados do componente
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [showDomainRequest, setShowDomainRequest] = useState(false);
  const [webhookUrlCopied, setWebhookUrlCopied] = useState(false);

  // Form para configuração de checkout
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<CheckoutConfigFormData>();

  // Form para solicitação de domínio
  const {
    register: registerDomain,
    handleSubmit: handleSubmitDomain,
    reset: resetDomain,
    formState: { errors: domainErrors }
  } = useForm<DomainRequestFormData>();

  // Observar mudanças no tipo de template
  const emailTemplateType = watch('email_template_type', 'tracking');

  // Buscar configuração existente
  const { data: currentConfig, isLoading: configLoading } = useQuery({
    queryKey: ['freelancer-checkout-config', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('freelancer_checkout_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('checkout_type', 'adorei')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data as FreelancerCheckoutConfig | null;
    },
    enabled: !!user?.id,
  });

  // Buscar domínios disponíveis do usuário
  const { data: availableDomains, isLoading: domainsLoading } = useQuery({
    queryKey: ['user-email-domains', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('email_domains')
        .select('*')
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      
      return data as EmailDomainWithOwner[];
    },
    enabled: !!user?.id,
  });

  // Preencher formulário quando carregar configuração
  useEffect(() => {
    if (currentConfig) {
      reset({
        checkout_type: currentConfig.checkout_type,
        email_domain_id: currentConfig.email_domain_id || '',
        email_template_type: currentConfig.email_template_type,
        custom_email_template: currentConfig.custom_email_template || '',
        from_name: currentConfig.from_name || '',
        from_email: currentConfig.from_email || '',
        reply_to_email: currentConfig.reply_to_email || '',
        webhook_secret: currentConfig.webhook_secret || ''
      });
    }
  }, [currentConfig, reset]);

  // Gerar webhook URL
  const webhookUrl = user?.id
    ? `https://fastlogexpress.ngrok.app/webhook/adorei/${user.id}`
    : '';

  // Copiar webhook URL
  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setWebhookUrlCopied(true);
      setTimeout(() => setWebhookUrlCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar URL:', error);
    }
  };

  // Mutation para salvar configuração
  const saveConfigMutation = useMutation({
    mutationFn: async (data: CheckoutConfigFormData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const configData = {
        user_id: user.id,
        checkout_type: 'adorei',
        checkout_config: {
          webhook_url: webhookUrl
        },
        webhook_secret: data.webhook_secret || null,
        email_domain_id: data.email_domain_id || null,
        email_template_type: data.email_template_type,
        custom_email_template: data.custom_email_template || null,
        from_name: data.from_name || null,
        from_email: data.from_email || null,
        reply_to_email: data.reply_to_email || null,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('freelancer_checkout_configs')
        .upsert(configData, { onConflict: 'user_id,checkout_type' })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freelancer-checkout-config'] });
      onConfigUpdate?.();
    }
  });

  // Mutation para solicitar domínio
  const requestDomainMutation = useMutation({
    mutationFn: async (data: DomainRequestFormData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: result, error } = await supabase
        .from('domain_requests')
        .insert({
          user_id: user.id,
          domain_name: data.domain_name,
          business_name: data.business_name,
          business_description: data.business_description,
          reason: data.reason,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      resetDomain();
      setShowDomainRequest(false);
      queryClient.invalidateQueries({ queryKey: ['domain-requests'] });
    }
  });

  const onSubmit = (data: CheckoutConfigFormData) => {
    saveConfigMutation.mutate(data);
  };

  const onSubmitDomainRequest = (data: DomainRequestFormData) => {
    requestDomainMutation.mutate(data);
  };

  if (configLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
          <p className="mt-2 text-gray-600">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Settings className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Configurações de Checkout
            </h2>
            <p className="text-sm text-gray-500">
              Configure sua integração com checkout Adorei
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL do Webhook
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
              />
              <button
                type="button"
                onClick={copyWebhookUrl}
                className={`px-3 py-2 rounded-md transition-colors ${
                  webhookUrlCopied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {webhookUrlCopied ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Use esta URL na configuração do webhook da Adorei
            </p>
            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-2">📖 Como configurar na Adorei:</h4>
              <ol className="text-xs text-blue-800 space-y-1">
                <li>1. Acesse <strong>www.adoorei.com.br</strong> e faça login</li>
                <li>2. Vá em <strong>Configurações → Webhooks</strong></li>
                <li>3. Cole a URL acima no campo <strong>"URL do Webhook"</strong></li>
                <li>4. Selecione os eventos: <strong>order.status.approved</strong></li>
                <li>5. Configure o Webhook Secret abaixo (opcional, para maior segurança)</li>
                <li>6. Salve e teste o webhook</li>
              </ol>
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                💡 <strong>Dica:</strong> Após configurar na Adorei, faça um pedido teste para verificar se tudo está funcionando!
              </div>
            </div>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook Secret (Opcional)
            </label>
            <div className="relative">
              <input
                type={showWebhookSecret ? 'text' : 'password'}
                {...register('webhook_secret')}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Digite o secret para validação de webhook"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showWebhookSecret ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Domínio de Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domínio de Email
            </label>
            <div className="flex items-center gap-2">
              <select
                {...register('email_domain_id')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={domainsLoading}
              >
                <option value="">Usar domínio padrão</option>
                {availableDomains?.map((domain: EmailDomainWithOwner) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domain_name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowDomainRequest(true)}
                className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors"
                title="Solicitar novo domínio"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {availableDomains?.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Você não possui domínios personalizados. Clique em + para solicitar um.
              </p>
            )}
          </div>

          {/* Tipo de Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Template de Email
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  value="tracking"
                  {...register('email_template_type')}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Template de Rastreamento (Padrão)</div>
                  <div className="text-sm text-gray-500">
                    Template da transportadora com informações de rastreamento
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  value="custom"
                  {...register('email_template_type')}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Template Personalizado</div>
                  <div className="text-sm text-gray-500">
                    Crie seu próprio template HTML personalizado
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Template Personalizado */}
          {emailTemplateType === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template HTML Personalizado
              </label>
              <textarea
                {...register('custom_email_template', {
                  required: emailTemplateType === 'custom' ? 'Template personalizado é obrigatório' : false
                })}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                placeholder={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Pedido Confirmado</title>
</head>
<body>
  <h1>Olá, {{customer_name}}!</h1>
  <p>Seu pedido foi confirmado.</p>
  <p>Código de rastreamento: <strong>{{tracking_code}}</strong></p>
  <a href="{{tracking_url}}">Rastrear Pedido</a>
</body>
</html>`}
              />
              {errors.custom_email_template && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.custom_email_template.message}
                </p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                <p className="font-medium mb-1">Variáveis disponíveis:</p>
                <div className="flex flex-wrap gap-2">
                  {['{{customer_name}}', '{{tracking_code}}', '{{order_id}}', '{{tracking_url}}', '{{amount}}', '{{city}}'].map(variable => (
                    <code key={variable} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {variable}
                    </code>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Configurações de Remetente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Remetente
              </label>
              <input
                type="text"
                {...register('from_name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Sua Empresa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email do Remetente
              </label>
              <input
                type="email"
                {...register('from_email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="contato@seudominio.com"
              />
              {errors.from_email && (
                <p className="mt-1 text-sm text-red-600">{errors.from_email.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de Resposta
              </label>
              <input
                type="email"
                {...register('reply_to_email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="suporte@seudominio.com"
              />
              {errors.reply_to_email && (
                <p className="mt-1 text-sm text-red-600">{errors.reply_to_email.message}</p>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2">
              {currentConfig && (
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Configuração salva
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://www.adoorei.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir Adorei
              </a>

              <button
                type="submit"
                disabled={!isDirty || saveConfigMutation.isPending}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saveConfigMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Salvar Configurações
              </button>
            </div>
          </div>
        </form>

        {/* Erros de salvamento */}
        {saveConfigMutation.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md"
          >
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Erro ao salvar configurações</p>
                <p>{saveConfigMutation.error.message}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modal de solicitação de domínio */}
        {showDomainRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Solicitar Novo Domínio
              </h3>

              <form onSubmit={handleSubmitDomain(onSubmitDomainRequest)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Domínio *
                  </label>
                  <input
                    type="text"
                    {...registerDomain('domain_name', { 
                      required: 'Domínio é obrigatório',
                      pattern: {
                        value: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: 'Formato de domínio inválido'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="meudominio.com"
                  />
                  {domainErrors.domain_name && (
                    <p className="mt-1 text-sm text-red-600">{domainErrors.domain_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    {...registerDomain('business_name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Minha Empresa Ltda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da Solicitação
                  </label>
                  <textarea
                    {...registerDomain('reason')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Explique por que precisa deste domínio personalizado..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDomainRequest(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={requestDomainMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {requestDomainMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    )}
                    Solicitar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}