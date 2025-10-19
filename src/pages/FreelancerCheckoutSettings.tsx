import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  ArrowLeft,
  Globe,
  Mail,
  Zap,
  ChevronRight,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';
import FreelancerCheckoutConfig from '../components/FreelancerCheckoutConfig';
import type { FreelancerCheckoutConfig as ConfigType, CheckoutType } from '../types/checkout';

interface CheckoutOption {
  id: CheckoutType;
  name: string;
  description: string;
  status: 'available' | 'coming_soon' | 'beta';
  icon: string;
  color: string;
}

export default function FreelancerCheckoutSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCheckout, setSelectedCheckout] = useState<CheckoutType | null>('adorei');

  // Opções de checkout disponíveis (extensível para futuros gateways)
  const checkoutOptions: CheckoutOption[] = [
    {
      id: 'adorei',
      name: 'Adorei',
      description: 'Integre com a plataforma Adorei para receber pedidos automaticamente',
      status: 'available',
      icon: '🛒',
      color: 'bg-blue-500'
    },
    // Futuros checkouts podem ser adicionados aqui
    // {
    //   id: 'mercadopago',
    //   name: 'Mercado Pago',
    //   description: 'Integração com checkout do Mercado Pago',
    //   status: 'coming_soon',
    //   icon: '💳',
    //   color: 'bg-yellow-500'
    // },
    // {
    //   id: 'stripe',
    //   name: 'Stripe',
    //   description: 'Integração com checkout do Stripe',
    //   status: 'coming_soon',
    //   icon: '💜',
    //   color: 'bg-purple-500'
    // }
  ];

  // Buscar configurações existentes do usuário
  const { data: existingConfigs, isLoading } = useQuery({
    queryKey: ['freelancer-checkout-configs', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('freelancer_checkout_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data as ConfigType[];
    },
    enabled: !!user?.id,
  });

  // Verificar se um checkout já está configurado
  const getCheckoutStatus = (checkoutId: CheckoutType) => {
    const config = existingConfigs?.find((c: ConfigType) => c.checkout_type === checkoutId);
    return config ? 'configured' : 'not_configured';
  };

  const getStatusBadge = (option: CheckoutOption) => {
    if (option.status === 'coming_soon') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          Em Breve
        </span>
      );
    }

    const configStatus = getCheckoutStatus(option.id);
    if (configStatus === 'configured') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Configurado
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Não Configurado
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/freelancer/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Voltar ao Dashboard
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações de Checkout</h1>
          <p className="text-sm text-gray-500">
            Configure suas integrações com plataformas de checkout para receber pedidos automaticamente
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Lateral - Lista de Checkouts */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Plataformas Disponíveis</h2>
              <p className="text-sm text-gray-500">
                Escolha qual checkout você quer configurar
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checkoutOptions.map((option) => (
                  <motion.div
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => option.status === 'available' && setSelectedCheckout(option.id)}
                      disabled={option.status !== 'available'}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedCheckout === option.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : option.status === 'available'
                          ? 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${option.color} flex items-center justify-center text-white text-lg`}>
                            {option.icon}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{option.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {option.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(option)}
                          {option.status === 'available' && (
                            <ChevronRight className={`w-4 h-4 ${
                              selectedCheckout === option.id ? 'text-emerald-600' : 'text-gray-400'
                            }`} />
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Informação sobre futuros checkouts */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Mais Integrações em Breve
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Estamos trabalhando para adicionar suporte a Mercado Pago, Stripe, PagSeguro e outros.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área Principal - Configuração do Checkout Selecionado */}
        <div className="lg:col-span-2">
          {selectedCheckout ? (
            <motion.div
              key={selectedCheckout}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {selectedCheckout === 'adorei' && (
                <FreelancerCheckoutConfig
                  onConfigUpdate={() => {
                    // Atualizar queries quando configuração for salva
                    console.log('Configuração do checkout Adorei atualizada');
                  }}
                />
              )}
            </motion.div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um Checkout
                </h3>
                <p className="text-gray-500">
                  Escolha uma plataforma de checkout no menu lateral para configurar a integração.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Status das Configurações */}
      {!isLoading && existingConfigs && existingConfigs.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Resumo das Configurações</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existingConfigs.map((config: ConfigType) => {
                const option = checkoutOptions.find(opt => opt.id === config.checkout_type);
                return (
                  <div
                    key={config.id}
                    className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className={`w-8 h-8 rounded ${option?.color || 'bg-gray-500'} flex items-center justify-center text-white text-sm mr-3`}>
                      {option?.icon || '📦'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{option?.name || config.checkout_type}</h4>
                      <p className="text-sm text-gray-500">
                        {config.is_active ? 'Ativo' : 'Inativo'} • 
                        Template: {config.email_template_type === 'custom' ? 'Personalizado' : 'Padrão'}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Como Funciona</h2>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <div>
                  <strong>Escolha o Checkout:</strong> Selecione a plataforma que você usa (ex: Adorei) no menu lateral
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <div>
                  <strong>Configure a Integração:</strong> Preencha as informações necessárias e copie a URL do webhook
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                <div>
                  <strong>Configure no Checkout:</strong> Adicione nossa URL de webhook na sua plataforma de pagamento
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                <div>
                  <strong>Personalize Emails:</strong> Escolha entre template padrão ou crie seu próprio design
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-medium">5</span>
                <div>
                  <strong>Pronto!</strong> Os pedidos chegam automaticamente e os emails são enviados com sua marca
                </div>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}