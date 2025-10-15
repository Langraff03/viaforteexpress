import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Package, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, Input, Alert } from '../components/ui';
import { supabase } from '../lib/supabaseClient';
import { api } from '../lib/api';
import { processPayment } from '../lib/payment';
import { useAuthStore } from '../lib/auth';
import SuccessModal from '../components/ui/SuccessModal';
const NewOrder = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdOrder, setCreatedOrder] = useState(null);
    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            isManualOrder: true
        }
    });
    const isManualOrder = watch('isManualOrder');
    const onSubmit = async (data) => {
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
            if (orderError)
                throw orderError;
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
        }
        catch (err) {
            console.error('Error creating order:', err);
            setError(err instanceof Error ? err.message : 'Erro ao criar pedido. Por favor, tente novamente.');
        }
        finally {
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Novo Pedido" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Crie um novo pedido e processe o pagamento" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Package, { className: "w-5 h-5 text-gray-500" }), _jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Informa\u00E7\u00F5es do Pedido" })] }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [error && (_jsx(Alert, { variant: "error", children: error })), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { ...register('isManualOrder'), type: "checkbox", id: "isManualOrder", className: "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "isManualOrder", className: "text-sm text-gray-700", children: "Pedido manual (sem pagamento obrigat\u00F3rio)" })] }), _jsx(Input, { label: "Nome do Cliente", error: errors.customerName?.message, ...register('customerName', { required: 'Nome é obrigatório' }) }), _jsx(Input, { label: "Email do Cliente", type: "email", error: errors.customerEmail?.message, ...register('customerEmail', {
                                        required: 'Email é obrigatório',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Email inválido'
                                        }
                                    }) }), _jsx(Input, { label: "Telefone", error: errors.customerPhone?.message, ...register('customerPhone', { required: 'Telefone é obrigatório' }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(Input, { label: "Cidade (Opcional)", error: errors.city?.message, ...register('city') }), _jsx(Input, { label: "Estado (Opcional)", error: errors.state?.message, ...register('state') })] }), _jsx(Input, { label: `Valor (R$) ${!isManualOrder ? '*' : '(Opcional)'}`, type: "number", step: "0.01", error: errors.amount?.message, ...register('amount', {
                                        required: !isManualOrder ? 'Valor é obrigatório para pedidos com pagamento' : false,
                                        min: {
                                            value: 0.01,
                                            message: 'Valor deve ser maior que zero'
                                        }
                                    }) }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "submit", variant: "primary", leftIcon: isManualOrder ? _jsx(Package, { className: "w-4 h-4" }) : _jsx(CreditCard, { className: "w-4 h-4" }), isLoading: isSubmitting, children: isManualOrder ? 'Criar Pedido Manual' : 'Criar Pedido e Processar Pagamento' }) })] }) })] }), showSuccessModal && createdOrder && (_jsx(SuccessModal, { isOpen: showSuccessModal, onClose: handleCloseModal, trackingCode: createdOrder.trackingCode, trackingLink: createdOrder.trackingLink, customerName: createdOrder.customerName, onViewOrders: handleViewOrders }))] }));
};
export default NewOrder;
