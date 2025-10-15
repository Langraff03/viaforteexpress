import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Package, User, Mail, MapPin, X, AlertCircle, Loader2, DollarSign, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
export function NewOrderModal({ isOpen, onClose, onSuccess, user }) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [createdOrder, setCreatedOrder] = useState(null);
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState(null);
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
    // Função para gerar código de rastreamento único (padrão do sistema)
    const generateTrackingCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };
    const onSubmit = async (data) => {
        if (!user?.id) {
            alert('Usuário não autenticado');
            return;
        }
        try {
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
            }
            catch (emailErr) {
                console.error('❌ Erro ao enfileirar email:', emailErr);
                setEmailSent(false);
                setEmailError(emailErr instanceof Error ? emailErr.message : 'Erro ao enviar email');
            }
            setCreatedOrder({ ...insertedOrder, tracking_code: trackingCode });
            setShowSuccess(true);
            reset();
        }
        catch (error) {
            console.error('❌ Erro ao criar pedido:', error);
            alert(error instanceof Error ? error.message : 'Erro ao criar pedido');
        }
    };
    const handleSuccessClose = () => {
        setShowSuccess(false);
        setCreatedOrder(null);
        setEmailSent(false);
        setEmailError(null);
        onClose();
        onSuccess();
    };
    const handleNewOrder = () => {
        setShowSuccess(false);
        setCreatedOrder(null);
        setEmailSent(false);
        setEmailError(null);
    };
    if (!isOpen)
        return null;
    // Modal de Sucesso
    if (showSuccess && createdOrder) {
        return (_jsx(AnimatePresence, { children: _jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", onClick: handleSuccessClose, children: _jsx(motion.div, { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.95, opacity: 0 }, className: "bg-white rounded-lg shadow-xl max-w-md w-full", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "p-8 text-center", children: [_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.2, type: 'spring' }, className: "mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4", children: _jsx(Check, { className: "w-8 h-8 text-green-600" }) }), _jsx(motion.h2, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.3 }, className: "text-xl font-semibold text-gray-900 mb-2", children: "Pedido Criado com Sucesso!" }), _jsx(motion.p, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.4 }, className: "text-gray-600 mb-4", children: emailSent
                                    ? 'O código de rastreamento foi gerado e o email foi enviado para o cliente.'
                                    : 'O código de rastreamento foi gerado, mas houve um problema no envio do email.' }), _jsxs(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.5 }, className: `p-3 rounded-lg mb-4 ${emailSent
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'}`, children: [_jsxs("div", { className: "flex items-center justify-center mb-1", children: [emailSent ? (_jsx(Check, { className: "w-4 h-4 text-green-600 mr-2" })) : (_jsx(AlertCircle, { className: "w-4 h-4 text-red-600 mr-2" })), _jsx("span", { className: `text-sm font-medium ${emailSent ? 'text-green-800' : 'text-red-800'}`, children: emailSent ? 'Email Enviado' : 'Erro no Email' })] }), emailError && (_jsx("p", { className: "text-xs text-red-600", children: emailError }))] }), _jsxs(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.6 }, className: "bg-gray-50 p-4 rounded-lg mb-6", children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "C\u00F3digo de Rastreamento:" }), _jsx("p", { className: "text-lg font-mono font-bold text-emerald-600", children: createdOrder.tracking_code })] }), _jsxs(motion.div, { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.7 }, className: "space-y-3", children: [_jsxs("button", { onClick: handleNewOrder, className: "w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Criar Outro Pedido"] }), _jsx("button", { onClick: handleSuccessClose, className: "w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors", children: "Fechar" })] })] }) }) }) }));
    }
    return (_jsx(AnimatePresence, { children: _jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", onClick: onClose, children: _jsxs(motion.div, { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.95, opacity: 0 }, className: "bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Criar Novo Pedido" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Gere um c\u00F3digo de rastreamento para seu cliente" })] }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "p-6", children: [_jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-2 bg-emerald-100 rounded-lg", children: _jsx(Package, { className: "w-5 h-5 text-emerald-600" }) }), _jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Dados do Cliente" })] }) }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Nome do Cliente *" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "w-5 h-5 absolute left-3 top-3 text-gray-400" }), _jsx("input", { type: "text", ...register('customer_name', {
                                                            required: 'Nome do cliente é obrigatório',
                                                            minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
                                                        }), className: `w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors.customer_name ? 'border-red-500' : 'border-gray-300'}`, placeholder: "Digite o nome completo do cliente", disabled: isSubmitting })] }), errors.customer_name && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "mt-1 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.customer_name.message] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email do Cliente *" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "w-5 h-5 absolute left-3 top-3 text-gray-400" }), _jsx("input", { type: "email", ...register('customer_email', {
                                                            required: 'Email do cliente é obrigatório',
                                                            pattern: {
                                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                                message: 'Email inválido'
                                                            }
                                                        }), className: `w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors.customer_email ? 'border-red-500' : 'border-gray-300'}`, placeholder: "cliente@exemplo.com", disabled: isSubmitting })] }), errors.customer_email && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "mt-1 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.customer_email.message] }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Cidade *" }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { className: "w-5 h-5 absolute left-3 top-3 text-gray-400" }), _jsx("input", { type: "text", ...register('city', {
                                                                    required: 'Cidade é obrigatória',
                                                                    minLength: { value: 2, message: 'Cidade deve ter pelo menos 2 caracteres' }
                                                                }), className: `w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors.city ? 'border-red-500' : 'border-gray-300'}`, placeholder: "S\u00E3o Paulo", disabled: isSubmitting })] }), errors.city && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "mt-1 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.city.message] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Estado *" }), _jsx("input", { type: "text", ...register('state', {
                                                            required: 'Estado é obrigatório',
                                                            minLength: { value: 2, message: 'Estado deve ter pelo menos 2 caracteres' },
                                                            maxLength: { value: 2, message: 'Estado deve ter no máximo 2 caracteres' }
                                                        }), className: `w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors.state ? 'border-red-500' : 'border-gray-300'}`, placeholder: "SP", maxLength: 2, style: { textTransform: 'uppercase' }, disabled: isSubmitting }), errors.state && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "mt-1 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.state.message] }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Descri\u00E7\u00E3o (Opcional)" }), _jsxs("div", { className: "relative", children: [_jsx(Package, { className: "w-5 h-5 absolute left-3 top-3 text-gray-400" }), _jsx("textarea", { ...register('description'), rows: 3, className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors", placeholder: "Descreva o pedido ou adicione observa\u00E7\u00F5es (opcional)", disabled: isSubmitting })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Valor (Opcional)" }), _jsxs("div", { className: "relative", children: [_jsx(DollarSign, { className: "w-5 h-5 absolute left-3 top-3 text-gray-400" }), _jsx("input", { type: "number", step: "0.01", min: "0", ...register('amount', {
                                                            min: { value: 0, message: 'Valor deve ser positivo' }
                                                        }), className: `w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${errors.amount ? 'border-red-500' : 'border-gray-300'}`, placeholder: "0,00", disabled: isSubmitting })] }), errors.amount && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "mt-1 text-sm text-red-600 flex items-center", children: [_jsx(AlertCircle, { className: "w-4 h-4 mr-1" }), errors.amount.message] })), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Deixe em branco ou 0 para pedidos sem valor" })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors", disabled: isSubmitting, children: "Cancelar" }), _jsx("button", { type: "submit", disabled: isSubmitting, className: "flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin" }), "Criando..."] })) : (_jsxs(_Fragment, { children: [_jsx(Mail, { className: "w-4 h-4" }), "Criar e Enviar Email"] })) })] }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Package, { className: "w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-semibold text-blue-900 mb-1", children: "\uD83D\uDCCB Como funciona:" }), _jsxs("ul", { className: "text-xs text-blue-800 space-y-1", children: [_jsx("li", { children: "\u2022 Um c\u00F3digo \u00FAnico de rastreamento ser\u00E1 gerado automaticamente" }), _jsx("li", { children: "\u2022 O cliente receber\u00E1 um email com o c\u00F3digo & link de rastreamento" }), _jsx("li", { children: "\u2022 Voc\u00EA pode acompanhar o status do pedido no seu painel" })] })] })] }) })] })] })] }) }) }));
}
