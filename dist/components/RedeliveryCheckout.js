import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { XCircle, Calendar, Check, Loader, AlertCircle } from 'lucide-react';
import { format, addDays, isAfter, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
export default function RedeliveryCheckout({ isOpen, onClose, trackingCode, onSuccess }) {
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        additionalInfo: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [availableDates, setAvailableDates] = useState([]);
    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const minDate = addDays(today, 8); // Data mínima para reentrega: hoje + 8 dias
            // Gerar próximos 30 dias (ou o que desejar)
            const allDates = [];
            for (let i = 0; i < 30; i++) {
                const date = addDays(today, i);
                // Ignorar domingos
                if (date.getDay() !== 0) {
                    allDates.push(date);
                }
            }
            // Filtrar para datas maiores ou iguais a minDate
            const filteredDates = allDates.filter((date) => isAfter(date, minDate) || isSameDay(date, minDate));
            setAvailableDates(filteredDates);
            setSelectedDate(null);
            setStep(1);
            setError(null);
            setSuccess(false);
            setFormData({
                name: '',
                email: '',
                phone: '',
                additionalInfo: '',
            });
        }
    }, [isOpen]);
    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const nextStep = () => {
        if (step === 1 && !selectedDate) {
            setError('Por favor, selecione uma data para continuar.');
            return;
        }
        if (step === 2) {
            if (!formData.name.trim()) {
                setError('Por favor, informe seu nome.');
                return;
            }
            if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
                setError('Por favor, informe um email válido.');
                return;
            }
            if (!formData.phone.trim()) {
                setError('Por favor, informe seu telefone.');
                return;
            }
        }
        setError(null);
        setStep((s) => (s === 1 ? 2 : s === 2 ? 3 : 3));
    };
    const prevStep = () => {
        setStep((s) => (s === 3 ? 2 : s === 2 ? 1 : 1));
        setError(null);
    };
    const handleSubmit = async () => {
        if (!selectedDate)
            return;
        setIsSubmitting(true);
        setError(null);
        try {
            console.log('Iniciando reagendamento para código:', trackingCode);
            console.log('Data selecionada:', selectedDate);
            const { error: supabaseError } = await supabase
                .from('orders')
                .update({
                redelivery_requested: true,
                redelivery_date: selectedDate.toISOString(),
                // Adicionada a data do reagendamento para cálculo correto do status
            })
                .eq('tracking_code', trackingCode);
            if (supabaseError) {
                console.error('Erro do Supabase:', supabaseError);
                throw supabaseError;
            }
            console.log('Reagendamento salvo com sucesso');
            setSuccess(true);
            // Pequeno delay para mostrar feedback de sucesso antes de fechar
            setTimeout(() => {
                try {
                    onSuccess(); // Chama refetch no componente pai
                    console.log('Callback onSuccess executado');
                }
                catch (callbackErr) {
                    console.error('Erro no callback onSuccess:', callbackErr);
                }
                onClose();
            }, 3000);
        }
        catch (err) {
            console.error('Erro ao agendar reentrega:', err);
            // Melhorar mensagem de erro baseada no tipo de erro
            let errorMessage = 'Ocorreu um erro ao agendar a reentrega. Por favor, tente novamente.';
            if (err && typeof err === 'object') {
                const errorObj = err; // Type assertion for error object
                if (errorObj?.message?.includes('permission')) {
                    errorMessage = 'Erro de permissão. Verifique se você tem acesso para modificar este pedido.';
                }
                else if (errorObj?.message?.includes('network')) {
                    errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
                }
                else if (errorObj?.code === 'PGRST116') {
                    errorMessage = 'Pedido não encontrado. Verifique o código de rastreamento.';
                }
            }
            setError(errorMessage);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", children: _jsxs(motion.div, { className: "relative w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-2xl", variants: modalVariants, initial: "hidden", animate: "visible", exit: "exit", children: [_jsx("div", { className: "absolute top-0 left-0 right-0 h-1.5 bg-gray-100 overflow-hidden rounded-t-2xl", children: _jsx(motion.div, { className: "h-full bg-gradient-to-r from-blue-500 to-indigo-600", initial: { width: '0%' }, animate: { width: `${(step / 3) * 100}%` }, transition: { duration: 0.5 } }) }), _jsx("button", { onClick: onClose, className: "absolute right-4 top-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors", "aria-label": "Fechar", children: _jsx(XCircle, { className: "w-5 h-5 text-gray-500" }) }), _jsxs("div", { className: "p-8 pt-12", children: [_jsxs("div", { className: "mb-8 text-center", children: [_jsx("div", { className: "bg-blue-100 text-blue-700 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5", children: _jsx(Calendar, { className: "w-7 h-7" }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Agendamento de Reentrega" }), _jsx("p", { className: "text-gray-600", children: step === 1
                                        ? 'Selecione uma data disponível para reentrega'
                                        : step === 2
                                            ? 'Complete suas informações para confirmação'
                                            : 'Confirme os dados para finalizar o agendamento' })] }), _jsx("div", { className: "mb-8", children: _jsxs(AnimatePresence, { mode: "wait", children: [step === 1 && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.3 }, children: _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: availableDates.map((date) => (_jsxs("button", { onClick: () => handleDateSelect(date), className: `p-3 rounded-xl border-2 transition-all flex flex-col items-center ${selectedDate &&
                                                    selectedDate.toDateString() === date.toDateString()
                                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                    : 'border-gray-200 hover:border-blue-300'}`, children: [_jsx("span", { className: "text-gray-500 text-xs mb-1", children: format(date, 'EEE', { locale: ptBR }).toUpperCase() }), _jsx("span", { className: "text-xl font-bold text-gray-900", children: format(date, 'dd') }), _jsx("span", { className: "text-xs text-gray-500", children: format(date, 'MMM', { locale: ptBR }) })] }, date.toISOString()))) }) }, "step1")), step === 2 && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.3 }, children: _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 mb-1", children: "Nome completo" }), _jsx("input", { type: "text", id: "name", name: "name", value: formData.name, onChange: handleInputChange, className: "w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all", placeholder: "Digite seu nome completo" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleInputChange, className: "w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all", placeholder: "seu@email.com" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-gray-700 mb-1", children: "Telefone" }), _jsx("input", { type: "tel", id: "phone", name: "phone", value: formData.phone, onChange: handleInputChange, className: "w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all", placeholder: "(00) 00000-0000" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "additionalInfo", className: "block text-sm font-medium text-gray-700 mb-1", children: "Informa\u00E7\u00F5es adicionais (opcional)" }), _jsx("textarea", { id: "additionalInfo", name: "additionalInfo", value: formData.additionalInfo, onChange: handleInputChange, rows: 3, className: "w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none", placeholder: "Instru\u00E7\u00F5es para entrega, ponto de refer\u00EAncia, etc." })] })] }) }, "step2")), step === 3 && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.3 }, children: success ? (_jsxs("div", { className: "text-center py-6", children: [_jsx("div", { className: "w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Check, { className: "w-8 h-8 text-emerald-600" }) }), _jsx("h3", { className: "text-xl font-bold text-gray-900 mb-2", children: "Reentrega Agendada!" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Sua solicita\u00E7\u00E3o de reentrega foi registrada com sucesso." }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Um email de confirma\u00E7\u00E3o foi enviado para ", formData.email] })] })) : (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-blue-50 rounded-xl p-5 border border-blue-100", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-3", children: "Resumo da solicita\u00E7\u00E3o" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "C\u00F3digo de rastreio:" }), _jsx("span", { className: "text-sm font-semibold text-gray-900", children: trackingCode })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Data selecionada:" }), _jsx("span", { className: "text-sm font-semibold text-gray-900", children: selectedDate && format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Nome:" }), _jsx("span", { className: "text-sm font-semibold text-gray-900", children: formData.name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Email:" }), _jsx("span", { className: "text-sm font-semibold text-gray-900", children: formData.email })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Telefone:" }), _jsx("span", { className: "text-sm font-semibold text-gray-900", children: formData.phone })] }), formData.additionalInfo && (_jsxs("div", { children: [_jsx("span", { className: "text-sm text-gray-600 block mb-1", children: "Informa\u00E7\u00F5es adicionais:" }), _jsx("span", { className: "text-sm text-gray-900 block px-3 py-2 bg-white rounded-lg border border-gray-100", children: formData.additionalInfo })] }))] })] }), _jsx("div", { className: "border-t border-gray-100 pt-4", children: _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Ao clicar em \"Confirmar Agendamento\" voc\u00EA concorda com nossos termos de servi\u00E7o para reentrega e confirma que os dados informados est\u00E3o corretos." }) })] })) }, "step3"))] }) }), _jsx(AnimatePresence, { children: error && (_jsxs(motion.div, { className: "mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" }), _jsx("p", { className: "text-sm", children: error })] })) }), _jsxs("div", { className: "flex gap-3 justify-end", children: [step > 1 && !success && (_jsx("button", { onClick: prevStep, className: "px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors", children: "Voltar" })), step < 3 ? (_jsx("button", { onClick: nextStep, className: "px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2", children: "Continuar" })) : !success ? (_jsx("button", { onClick: handleSubmit, disabled: isSubmitting, className: "px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 flex items-center", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader, { className: "w-4 h-4 mr-2 animate-spin" }), "Processando..."] })) : ('Confirmar Agendamento') })) : (_jsx("button", { onClick: onClose, className: "px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium shadow-md hover:shadow-lg transition-all", children: "Fechar" }))] })] })] }) }));
}
