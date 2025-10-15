import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Package, CreditCard, User, Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, Input, Alert } from '../components/ui';
import { supabase } from '../lib/supabaseClient';
import { api } from '../lib/api';
import { processPayment } from '../lib/payment';
import { useAuthStore } from '../lib/auth';
import SuccessModal from '../components/ui/SuccessModal';

interface NewOrderFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  city?: string;
  state?: string;
  amount?: number;
  isManualOrder: boolean;
}

const NewOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{
    trackingCode: string;
    trackingLink: string;
    customerName: string;
  } | null>(null);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<NewOrderFormData>({
    defaultValues: {
      isManualOrder: true
    }
  });

  const isManualOrder = watch('isManualOrder');

  const onSubmit = async (data: NewOrderFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Verificar se o usuário está logado e tem as informações necessárias
      if (!user || !user.client_id || !user.gateway_id) {
        throw new Error('Usuário não autenticado ou sem permissões adequadas');
      }

      // 1. Gerar código de rastreio único
      const trackingCode = await api.generateUniqueTrackingCode();

      // 2. Criar pedido no banco
      const orderData = {
        tracking_code: trackingCode,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        client_id: user.client_id,
        gateway_id: user.gateway_id,
        status: 'created',
        city: data.city || null,
        state: data.state || null,
        amount: data.amount ? Math.round(data.amount * 100) : null, // Converter para centavos
        payment_status: data.isManualOrder ? null : 'pending'
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Processar pagamento apenas se não for pedido manual
      if (!data.isManualOrder && data.amount) {
        const payment = await processPayment(order.id, data.amount, {
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone
        });
      }

      // 4. Gerar link de rastreamento e mostrar modal de sucesso
      const trackingLink = api.generateTrackingLink(trackingCode);
      setCreatedOrder({
        trackingCode,
        trackingLink,
        customerName: data.customerName
      });
      setShowSuccessModal(true);

    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar pedido. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewOrders = () => {
    setShowSuccessModal(false);
    navigate('/orders');
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/orders');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Pedido</h1>
        <p className="mt-1 text-sm text-gray-500">
          Crie um novo pedido e processe o pagamento
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Informações do Pedido</h2>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="error">
                {error}
              </Alert>
            )}

            {/* Tipo de Pedido */}
            <div className="flex items-center space-x-2">
              <input
                {...register('isManualOrder')}
                type="checkbox"
                id="isManualOrder"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isManualOrder" className="text-sm text-gray-700">
                Pedido manual (sem pagamento obrigatório)
              </label>
            </div>

            <Input
              label="Nome do Cliente"
              error={errors.customerName?.message}
              {...register('customerName', { required: 'Nome é obrigatório' })}
            />

            <Input
              label="Email do Cliente"
              type="email"
              error={errors.customerEmail?.message}
              {...register('customerEmail', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
            />

            <Input
              label="Telefone"
              error={errors.customerPhone?.message}
              {...register('customerPhone', { required: 'Telefone é obrigatório' })}
            />

            {/* Campos Opcionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Cidade (Opcional)"
                error={errors.city?.message}
                {...register('city')}
              />

              <Input
                label="Estado (Opcional)"
                error={errors.state?.message}
                {...register('state')}
              />
            </div>

            <Input
              label={`Valor (R$) ${!isManualOrder ? '*' : '(Opcional)'}`}
              type="number"
              step="0.01"
              error={errors.amount?.message}
              {...register('amount', {
                required: !isManualOrder ? 'Valor é obrigatório para pedidos com pagamento' : false,
                min: {
                  value: 0.01,
                  message: 'Valor deve ser maior que zero'
                }
              })}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                leftIcon={isManualOrder ? <Package className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                isLoading={isSubmitting}
              >
                {isManualOrder ? 'Criar Pedido Manual' : 'Criar Pedido e Processar Pagamento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal de Sucesso */}
      {showSuccessModal && createdOrder && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={handleCloseModal}
          trackingCode={createdOrder.trackingCode}
          trackingLink={createdOrder.trackingLink}
          customerName={createdOrder.customerName}
          onViewOrders={handleViewOrders}
        />
      )}
    </div>
  );
};

export default NewOrder;