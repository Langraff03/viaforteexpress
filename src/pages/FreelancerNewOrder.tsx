import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Package,
  User,
  Mail,
  MapPin,
  Plus,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  DollarSign,
  X,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { useAuth } from '../lib/auth';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
// ✅ Temporariamente comentado - função movida para backend
// import { sendTrackingEmail } from '../lib/emailService';

interface FreelancerOrderData {
  customer_name: string;
  customer_email: string;
  city: string;
  state: string;
  description?: string;
  amount?: number;
}

export default function FreelancerNewOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FreelancerOrderData>();

  // Função para gerar código de rastreamento único (padrão do sistema)
  const generateTrackingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Função para copiar link de rastreamento
  const copyTrackingLink = async () => {
    if (!createdOrder?.tracking_code) return;
    
    const trackingUrl = `https://rastreio.viaforteexpress.com/tracking/${createdOrder.tracking_code}`;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(trackingUrl);
      } else {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = trackingUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar link:', error);
    }
  };

  // Mutation para criar pedido
  const createOrderMutation = useMutation({
    mutationFn: async (data: FreelancerOrderData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const trackingCode = generateTrackingCode();
      
      // Criar o pedido no banco de dados
      const orderData = {
        tracking_code: trackingCode,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        city: data.city,
        state: data.state,
        amount: data.amount ? data.amount * 100 : 0, // Converter para centavos
        created_by: user.id,
        status: 'created',
        payment_status: 'manual',
        payment_id: `freelancer_${Date.now()}`,
        external_id: `freelancer_${Date.now()}`,
        client_id: user.client_id || '0ec3137d-ee68-4aba-82de-143b3c61516a',
        gateway_id: '7e7e93d9-fc1a-4ae0-b7ab-775494d57cad',
        redelivery_count: 0
      };

      console.log('🔄 Criando pedido freelancer:', orderData);

      const { data: insertedOrder, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar pedido:', error);
        throw new Error(`Erro ao criar pedido: ${error.message}`);
      }

      console.log('✅ Pedido criado com sucesso:', insertedOrder);

      // Enfileirar email via API do webhook-server
      try {
        console.log('📧 Enfileirando email de rastreamento...');
        const webhookServerUrl = import.meta.env.VITE_WEBHOOK_SERVER_URL || 'http://localhost:3001';
        
        const emailResponse = await fetch(`${webhookServerUrl}/api/email/queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: data.customer_email,
            subject: `📦 Pedido ${trackingCode} - VIA FORTE EXPRESS`,
            context: {
              order_id: insertedOrder.id,
              customerName: data.customer_name,
              trackingCode: trackingCode,
              trackingUrl: `https://rastreio.viaforteexpress.com/tracking/${trackingCode}`,
            },
          }),
        });

        if (!emailResponse.ok) {
          throw new Error(`API de email retornou: ${emailResponse.status}`);
        }

        const emailResult = await emailResponse.json();
        console.log('✅ Email enfileirado com sucesso!', emailResult);
        setEmailSent(true);
        setEmailError(null);
      } catch (emailErr) {
        console.error('❌ Erro ao enfileirar email:', emailErr);
        setEmailSent(false);
        setEmailError(emailErr instanceof Error ? emailErr.message : 'Erro ao enviar email');
      }

      return { ...insertedOrder, tracking_code: trackingCode };
    },
    onSuccess: (data: any) => {
      setCreatedOrder(data);
      setShowSuccess(true);

      // Invalidar queries para atualizar as listas
      queryClient.invalidateQueries({ queryKey: ['freelancer-stats'] });
      queryClient.invalidateQueries({ queryKey: ['freelancer-orders'] });
      queryClient.invalidateQueries({ queryKey: ['freelancer-recent-orders'] });

      // Resetar formulário
      reset();
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao criar pedido:', error);
    }
  });

  const onSubmit = (data: FreelancerOrderData) => {
    createOrderMutation.mutate(data);
  };
  const handleSuccessClose = () => {
    setShowSuccess(false);
    setCreatedOrder(null);
    setEmailSent(false);
    setEmailError(null);
    setLinkCopied(false);
  };

  const handleNewOrder = () => {
    handleSuccessClose();
  };

  const handleViewOrders = () => {
    handleSuccessClose();
    navigate('/freelancer/orders');
  };

  // Modal de Sucesso
  if (showSuccess && createdOrder) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md mx-auto"
      >
        <Card>
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
            >
              <Check className="w-8 h-8 text-green-600" />
            </motion.div>
            
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-semibold text-gray-900 mb-2"
            >
              Pedido Criado com Sucesso!
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-4"
            >
              {emailSent 
                ? 'O código de rastreamento foi gerado e o email foi enviado para o cliente.'
                : 'O código de rastreamento foi gerado, mas houve um problema no envio do email.'
              }
            </motion.p>

            {/* Status do Email */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`p-3 rounded-lg mb-4 ${
                emailSent 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {emailSent ? (
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                )}
                <span className={`text-sm font-medium ${
                  emailSent ? 'text-green-800' : 'text-red-800'
                }`}>
                  {emailSent ? 'Email Enviado' : 'Erro no Email'}
                </span>
              </div>
              {emailError && (
                <p className="text-xs text-red-600">{emailError}</p>
              )}
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-50 p-4 rounded-lg mb-6"
            >
              <p className="text-sm text-gray-600 mb-1">Código de Rastreamento:</p>
              <p className="text-lg font-mono font-bold text-emerald-600 mb-3">
                {createdOrder.tracking_code}
              </p>
              <button
                onClick={copyTrackingLink}
                className={`w-full flex items-center justify-center px-4 py-2 rounded-md border transition-all duration-200 ${
                  linkCopied
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {linkCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Link Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link de Rastreio
                  </>
                )}
              </button>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              <button
                onClick={handleNewOrder}
                className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Outro Pedido
              </button>
              <button
                onClick={handleViewOrders}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Ver Todos os Pedidos
              </button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      {/* Cabeçalho */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/freelancer/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Criar Novo Pedido</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gere um código de rastreamento para seu cliente
        </p>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-lg font-medium text-gray-900">
              Dados do Cliente
            </h2>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome do Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Cliente *
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  {...register('customer_name', { 
                    required: 'Nome do cliente é obrigatório',
                    minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
                  })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                    errors.customer_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Digite o nome completo do cliente"
                  disabled={isSubmitting}
                />
              </div>
              {errors.customer_name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.customer_name.message}
                </motion.p>
              )}
            </div>

            {/* Email do Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email do Cliente *
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  {...register('customer_email', { 
                    required: 'Email do cliente é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                    errors.customer_email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="cliente@exemplo.com"
                  disabled={isSubmitting}
                />
              </div>
              {errors.customer_email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.customer_email.message}
                </motion.p>
              )}
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade *
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    {...register('city', { 
                      required: 'Cidade é obrigatória',
                      minLength: { value: 2, message: 'Cidade deve ter pelo menos 2 caracteres' }
                    })}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="São Paulo"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.city && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 flex items-center"
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.city.message}
                  </motion.p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <input
                  type="text"
                  {...register('state', { 
                    required: 'Estado é obrigatório',
                    minLength: { value: 2, message: 'Estado deve ter pelo menos 2 caracteres' },
                    maxLength: { value: 2, message: 'Estado deve ter no máximo 2 caracteres' }
                  })}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="SP"
                  maxLength={2}
                  style={{ textTransform: 'uppercase' }}
                  disabled={isSubmitting}
                />
                {errors.state && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 flex items-center"
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.state.message}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Descrição (Opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (Opcional)
              </label>
              <div className="relative">
                <Package className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  placeholder="Descreva o pedido ou adicione observações (opcional)"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Valor (Opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor (Opcional)
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('amount', { 
                    min: { value: 0, message: 'Valor deve ser positivo' }
                  })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                  disabled={isSubmitting}
                />
              </div>
              {errors.amount && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.amount.message}
                </motion.p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco ou 0 para pedidos sem valor
              </p>
            </div>

            {/* Botões */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/freelancer/dashboard')}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando e Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Criar e Enviar Email
                  </>
                )}
              </button>
            </div>

            {/* Mostrar erro da mutation */}
            {createOrderMutation.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">
                    {createOrderMutation.error instanceof Error 
                      ? createOrderMutation.error.message 
                      : 'Erro ao criar pedido'
                    }
                  </span>
                </div>
              </motion.div>
            )}
          </form>

          {/* Informações importantes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-blue-50 p-4 rounded-lg"
          >
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              ⚡ Como funciona:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Um código único de rastreamento será gerado automaticamente</li>
              <li>• O cliente receberá um email com o código e link de rastreamento</li>
              <li>• Você pode acompanhar o status do pedido no seu painel</li>
              <li>• Cidade e estado são obrigatórios para o sistema de rastreamento</li>
            </ul>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}