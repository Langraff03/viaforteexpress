import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { XCircle, Calendar, Check, Loader, AlertCircle } from 'lucide-react';
import { format, addDays, isAfter, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RedeliveryCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  trackingCode: string;
  onSuccess: () => void;
}

export default function RedeliveryCheckout({ isOpen, onClose, trackingCode, onSuccess }: RedeliveryCheckoutProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    additionalInfo: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const minDate = addDays(today, 8); // Data mínima para reentrega: hoje + 8 dias

      // Gerar próximos 30 dias (ou o que desejar)
      const allDates: Date[] = [];
      for (let i = 0; i < 30; i++) {
        const date = addDays(today, i);
        // Ignorar domingos
        if (date.getDay() !== 0) {
          allDates.push(date);
        }
      }

      // Filtrar para datas maiores ou iguais a minDate
      const filteredDates = allDates.filter(
        (date) => isAfter(date, minDate) || isSameDay(date, minDate)
      );

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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    setStep((s) => (s === 1 ? 2 : s === 2 ? 3 : 3) as 1 | 2 | 3);
  };

  const prevStep = () => {
    setStep((s) => (s === 3 ? 2 : s === 2 ? 1 : 1) as 1 | 2 | 3);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedDate) return;
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
        } catch (callbackErr) {
          console.error('Erro no callback onSuccess:', callbackErr);
        }
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Erro ao agendar reentrega:', err);

      // Melhorar mensagem de erro baseada no tipo de erro
      let errorMessage = 'Ocorreu um erro ao agendar a reentrega. Por favor, tente novamente.';

      if (err && typeof err === 'object') {
        const errorObj = err as any; // Type assertion for error object

        if (errorObj?.message?.includes('permission')) {
          errorMessage = 'Erro de permissão. Verifique se você tem acesso para modificar este pedido.';
        } else if (errorObj?.message?.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (errorObj?.code === 'PGRST116') {
          errorMessage = 'Pedido não encontrado. Verifique o código de rastreamento.';
        }
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        className="relative w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-2xl"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100 overflow-hidden rounded-t-2xl">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Fechar"
        >
          <XCircle className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8 pt-12">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="bg-blue-100 text-blue-700 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5">
              <Calendar className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Agendamento de Reentrega</h2>
            <p className="text-gray-600">
              {step === 1
                ? 'Selecione uma data disponível para reentrega'
                : step === 2
                ? 'Complete suas informações para confirmação'
                : 'Confirme os dados para finalizar o agendamento'}
            </p>
          </div>

          {/* Step content */}
          <div className="mb-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableDates.map((date) => (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDateSelect(date)}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center ${
                          selectedDate &&
                          selectedDate.toDateString() === date.toDateString()
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-gray-500 text-xs mb-1">
                          {format(date, 'EEE', { locale: ptBR }).toUpperCase()}
                        </span>
                        <span className="text-xl font-bold text-gray-900">{format(date, 'dd')}</span>
                        <span className="text-xs text-gray-500">{format(date, 'MMM', { locale: ptBR })}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome completo
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="Digite seu nome completo"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="seu@email.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
                        Informações adicionais (opcional)
                      </label>
                      <textarea
                        id="additionalInfo"
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                        placeholder="Instruções para entrega, ponto de referência, etc."
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {success ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Reentrega Agendada!</h3>
                      <p className="text-gray-600 mb-4">
                        Sua solicitação de reentrega foi registrada com sucesso.
                      </p>
                      <p className="text-sm text-gray-500">
                        Um email de confirmação foi enviado para {formData.email}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                        <h3 className="font-medium text-gray-900 mb-3">Resumo da solicitação</h3>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Código de rastreio:</span>
                            <span className="text-sm font-semibold text-gray-900">{trackingCode}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Data selecionada:</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {selectedDate && format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Nome:</span>
                            <span className="text-sm font-semibold text-gray-900">{formData.name}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Email:</span>
                            <span className="text-sm font-semibold text-gray-900">{formData.email}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Telefone:</span>
                            <span className="text-sm font-semibold text-gray-900">{formData.phone}</span>
                          </div>

                          {formData.additionalInfo && (
                            <div>
                              <span className="text-sm text-gray-600 block mb-1">Informações adicionais:</span>
                              <span className="text-sm text-gray-900 block px-3 py-2 bg-white rounded-lg border border-gray-100">
                                {formData.additionalInfo}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Ao clicar em "Confirmar Agendamento" você concorda com nossos termos de serviço
                          para reentrega e confirma que os dados informados estão corretos.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            {step > 1 && !success && (
              <button
                onClick={prevStep}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Continuar
              </button>
            ) : !success ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Agendamento'
                )}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium shadow-md hover:shadow-lg transition-all"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}