import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Mail,
  Loader,
  Clock,
  MapPin,
  Info,
  LocateFixed,
  AlertTriangle,
  Copy,
  ChevronDown,
  PhoneCall,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  BarChart4,
  Building,
  Globe,
  LucideIcon,
  PackageCheck, // Para o botão Copiado
  Package, // Ícone adicionado para o InfoCard
  Calendar, // Ícone adicionado para o botão de reagendamento
  XCircle, // Ícone adicionado para o botão de fechar notificação
  Hourglass, // Ícone para eventos futuros
} from 'lucide-react';
import { format, addMinutes, isFuture } from 'date-fns'; // isFuture importado
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import RedeliveryCheckout from "../components/RedeliveryCheckout"; // Ajuste o caminho se necessário
import LoadingScreen from "../components/ui/LoadingScreen"; // Ajuste o caminho se necessário
import ErrorScreen from "../components/ui/ErrorScreen"; // Ajuste o caminho se necessário
import {
  useTrackingLogic,
  StepInfo, // Importa tipos do hook
  SubEvent, // Importa tipos do hook
  StepKey, // Importa tipo StepKey
} from "../hooks/useTrackingLogic"; // Ajuste o caminho se necessário
import {
  calculateSubEventTimestamp, // Importa função auxiliar necessária
  getBaseDateForStatus, // Importa função auxiliar necessária
  getSimulatedRoute, // Importa função auxiliar necessária
  SubEventTimestampResult, // Importa o tipo de retorno
} from "../utils/simulationHelpers"; // Ajuste o caminho se necessário

// --- Subcomponentes Visuais Internos ---

// Card de Informação Reutilizável
interface InfoCardProps {
  icon: LucideIcon;
  label: string;
  value: string | React.ReactNode;
  iconColorClass?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon: Icon, label, value, iconColorClass = 'text-blue-600' }) => (
  <motion.div
    className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex items-start space-x-4 min-w-0"
    whileHover={{ y: -3 }}
  >
    <div className={`mt-1 p-2 bg-blue-50 rounded-full ${iconColorClass} flex-shrink-0`}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 truncate">{label}</p>
      <p className="text-sm font-semibold text-gray-800 break-words overflow-wrap-anywhere">{value}</p>
    </div>
  </motion.div>
);

// Item do FAQ Reutilizável
interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, isOpen, onClick }) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
    <button
      className="w-full flex justify-between items-center p-5 text-left font-medium text-gray-800 hover:bg-gray-50 transition-colors duration-200"
      onClick={onClick}
    >
      <span>{question}</span>
      <ChevronDown
        className={`h-5 w-5 text-gray-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="content"
          initial="collapsed"
          animate="open"
          exit="collapsed"
          variants={{
            open: { opacity: 1, height: 'auto', marginTop: '0px', marginBottom: '20px' },
            collapsed: { opacity: 0, height: 0, marginTop: '0px', marginBottom: '0px' },
          }}
          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          className="px-5 text-sm text-gray-600 leading-relaxed"
        >
          {answer}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// --- Componente Principal da Página ---

export default function TrackingPage() {
  const { code } = useParams<{ code: string }>();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [now, setNow] = useState(new Date()); // Estado para guardar a hora atual

  // Usa o hook centralizado para obter toda a lógica e dados
  const {
    order,
    isLoading,
    error,
    refetch,
    currentStatus,
    visibleSteps,
    statusType,
    colors,
    originHub,
    destination,
    fakeDeliveryPerson,
    fakeFailureReason,
    estimatedWindow,
    formattedCreationDate,
    daysSinceCreation,
    estimatedDeliveryDate,
    getStatusType, // Importa do hook
    STATUS_COLORS, // Importa do hook
  } = useTrackingLogic(code);

  // Efeito para atualizar a hora atual a cada minuto
  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 60000); // Atualiza a cada 60 segundos
    return () => clearInterval(intervalId);
  }, []);

  // Efeito para mostrar notificação após um tempo
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Função para copiar código de rastreio
  const copyToClipboard = () => {
    if (order) {
      navigator.clipboard.writeText(order.tracking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Função para substituir placeholders nas mensagens
  const replacePlaceholders = (text: string, stepKey: StepKey) => {
    let replacedText = text;
    if (order) {
      replacedText = replacedText.replace(/\[Nome Cliente\]/g, order.customer_name ? order.customer_name.split(' ')[0] : 'Cliente');
      replacedText = replacedText.replace(/\[Nome Fictício\]/g, fakeDeliveryPerson || 'Nosso Entregador');
      replacedText = replacedText.replace(/\[Motivo Fictício\]/g, fakeFailureReason || 'um imprevisto');
      replacedText = replacedText.replace(/\[Data\]/g, order.redelivery_date ? format(new Date(order.redelivery_date), "dd/MM/yyyy", { locale: ptBR }) : 'data futura');
      replacedText = replacedText.replace(/\[Hora Fictícia\]/g, () => {
        const baseDate = getBaseDateForStatus(stepKey, order);
        return baseDate ? format(addMinutes(baseDate, Math.random() * 120 + 30), "HH:mm") : '14:30';
      });

      const route = getSimulatedRoute(order.state || '');
      replacedText = replacedText.replace(/\[HUB_(\d+)\]/g, (match, indexStr) => {
        const index = parseInt(indexStr, 10);
        return route[index] || 'Centro de Distribuição Regional';
      });
    }
    return replacedText;
  };

  // Efeito de Parallax para o fundo
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const parallaxElements = document.querySelectorAll('.parallax-element');
      parallaxElements.forEach((element, index) => {
        const speed = (index % 2 === 0 ? 0.05 : -0.03) * 0.6;
        if (element instanceof HTMLElement) {
          element.style.transform = `translateY(${scrollPosition * speed}px)`;
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Renderização condicional (Loading, Error, Content)
  if (isLoading) return <LoadingScreen />;
  if (error || !order) {
    // Garante que o tipo passado para ErrorScreen é Error | null
    const errorToShow = error instanceof Error ? error : error ? new Error(String(error)) : null;
    return <ErrorScreen error={errorToShow} onRetry={refetch} />;
  }

  // --- Renderização Principal ---
  const currentStepDetails = visibleSteps.find(step => step.key === currentStatus);
  const currentStepIndex = visibleSteps.findIndex(step => step.key === currentStatus);
  const progressPercentage = (currentStepIndex / (visibleSteps.length - 1)) * 100;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-${colors.progressBar.split('-')[1]}-50/20 py-12 px-4 sm:px-6 lg:px-8 sm:py-20 relative overflow-hidden`}>
      {/* Elementos de Fundo com Parallax Sutil */}
      <div className={`absolute top-0 right-0 w-96 h-96 ${colors.lightBg} rounded-full opacity-30 blur-3xl transform translate-x-1/3 -translate-y-1/3 z-0 parallax-element`}></div>
      <div className={`absolute bottom-0 left-0 w-80 h-80 ${colors.lightBg} rounded-full opacity-30 blur-3xl transform -translate-x-1/3 translate-y-1/3 z-0 parallax-element`}></div>
      <div className={`absolute top-1/3 left-1/4 w-72 h-72 ${colors.lightBg} rounded-full opacity-20 blur-3xl z-0 parallax-element`}></div>
      <div className={`absolute top-2/3 right-1/4 w-64 h-64 ${colors.lightBg} rounded-full opacity-20 blur-3xl z-0 parallax-element`}></div>

      {/* Container Principal */}
      <motion.div
        className="max-w-4xl mx-auto relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* --- Cabeçalho --- */}
        <div className={`bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} rounded-3xl p-8 mb-10 shadow-2xl ${colors.shadow} text-white relative overflow-hidden`}>
          {/* Efeito de brilho */}
          <div className={`absolute -top-10 -right-10 w-40 h-40 ${colors.lightBg} rounded-full opacity-30 blur-2xl`}></div>
          <div className={`absolute -bottom-10 -left-10 w-32 h-32 ${colors.lightBg} rounded-full opacity-20 blur-2xl`}></div>

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">Rastreamento do Pedido</h1>
                <p className="text-sm opacity-80">Olá, {order.customer_name}! Acompanhe sua entrega.</p>
              </div>
              <div className="flex items-center mt-4 sm:mt-0 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-mono cursor-pointer group" onClick={copyToClipboard}>
                <span>{order.tracking_code}</span>
                <button className="ml-2 text-white opacity-70 group-hover:opacity-100 transition-opacity">
                  {copied ? <PackageCheck className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-6">
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="opacity-80 mb-1">Status Atual</p>
                <p className="font-semibold">{currentStepDetails?.label || 'Processando'}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="opacity-80 mb-1">Pedido Criado em</p>
                <p className="font-semibold">{formattedCreationDate}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl">
                <p className="opacity-80 mb-1">Entrega Estimada</p>
                <p className="font-semibold">{estimatedDeliveryDate || 'Calculando...'}</p>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${colors.progressBar}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeInOut" }}
              ></motion.div>
            </div>
            {estimatedWindow && (
              <p className="text-xs text-center mt-2 opacity-80">Janela de entrega estimada hoje: {estimatedWindow}</p>
            )}
          </div>
        </div>

        {/* --- Seção de Informações da Entrega --- */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center">
            <BarChart4 className="h-5 w-5 mr-2 text-blue-600" />
            Informações da Entrega
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <InfoCard icon={Building} label="Transportadora" value="Via Forte Express" iconColorClass="text-purple-600" />
            <InfoCard icon={Clock} label="Tempo desde Criação" value={`${daysSinceCreation} dias`} iconColorClass="text-orange-600" />
            <InfoCard icon={Globe} label="Origem" value={originHub} iconColorClass="text-red-600" />
            <InfoCard icon={MapPin} label="Destino" value={destination} iconColorClass="text-emerald-600" />
            <InfoCard icon={Package} label="Tipo de Envio" value="Standard" iconColorClass="text-cyan-600" />
          </div>
        </div>

        {/* --- Timeline Detalhada --- */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <LocateFixed className="h-5 w-5 mr-2 text-blue-600" />
            Histórico do Pedido
          </h2>
          <div className="relative pl-8 py-4 border-l-2 border-dashed border-gray-300">
            {visibleSteps.map((step, index) => {
              const isCurrent = step.key === currentStatus;
              const isPast = visibleSteps.findIndex(s => s.key === currentStatus) > index;
              const Icon = step.icon;
              const stepColors = STATUS_COLORS[getStatusType(step.key)]; // Usa a função importada

              const baseDate = getBaseDateForStatus(step.key, order);
              const mainMessageText = replacePlaceholders(step.mainMessage, step.key);

              return (
                <motion.div
                  key={step.key}
                  className="mb-10 relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  {/* Ícone na linha do tempo */}
                  <div
                    className={`absolute -left-[42px] top-0 flex items-center justify-center rounded-full transition-all duration-300
                      ${isCurrent
                        ? `w-12 h-12 border-4 ${stepColors.border} ${stepColors.bg} ring-4 ring-offset-1 ${stepColors.progressBar.replace('bg-', 'ring-')}/70` // Atual: Cores dinâmicas
                        : isPast
                        ? `w-10 h-10 border-4 ${stepColors.border} ${stepColors.bg}` // Passado: Cores dinâmicas
                        : 'w-10 h-10 border-4 border-gray-300 bg-gray-200' // Futuro: Cinza
                      }`}
                  >
                    <Icon className={`transition-colors duration-300 ${isCurrent || isPast ? stepColors.icon : 'text-gray-500'} ${isCurrent ? 'h-6 w-6' : 'h-5 w-5'}`} />
                  </div>

                  {/* Conteúdo do Passo */}
                  <div className={`ml-4 p-6 rounded-2xl transition-all duration-300
                    ${isCurrent
                      ? 'bg-white shadow-xl border border-gray-100'
                      : isPast
                      ? 'bg-white/70 shadow-md border border-gray-50'
                      : 'bg-gray-100/50 border border-transparent opacity-70' // Futuro: Levemente transparente
                    }`}>
                    <p className={`text-lg font-semibold mb-2 transition-colors duration-300 ${isCurrent || isPast ? stepColors.text : 'text-gray-600'}`}>{step.label}</p>
                    <p className={`text-sm mb-4 transition-colors duration-300 ${isCurrent || isPast ? 'text-gray-700' : 'text-gray-500'}`}>{mainMessageText}</p>

                    {/* Sub-eventos (filtrados por tempo) */}
                    {step.subEvents && (isCurrent || isPast) && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        {step.subEvents.map((subEvent, subIndex) => {
                          // Calcula o timestamp e obtém o objeto Date e a string formatada
                          const timestampResult: SubEventTimestampResult = calculateSubEventTimestamp(subEvent, baseDate, order);
                          const subEventText = replacePlaceholders(subEvent.description, step.key);
                          // Verifica se a data calculada é futura em relação ao 'now' do estado
                          const isEventFuture = timestampResult.date ? isFuture(timestampResult.date) : false;

                          // Renderiza apenas se a data não for futura OU se for futura mas quisermos mostrar como 'previsto'
                          if (!isEventFuture) {
                            // Evento passado ou presente
                            return (
                              <motion.div
                                key={subIndex}
                                className="flex items-center text-xs text-gray-500"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (index * 0.1) + (subIndex * 0.05) + 0.2, duration: 0.4 }}
                              >
                                <Clock className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-gray-400" />
                                <span className="mr-2 font-medium text-gray-600">
                                  {timestampResult.formatted || "--:--"} {/* Usa a string formatada */}
                                </span>
                                <span>{subEventText}</span>
                              </motion.div>
                            );
                          } else {
                            // Evento futuro - Mostrar como previsto
                            return (
                              <motion.div
                                key={subIndex}
                                className="flex items-center text-xs text-gray-400 italic"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 0.7, y: 0 }} // Animação mais sutil para futuros
                                transition={{ delay: (index * 0.1) + (subIndex * 0.05) + 0.2, duration: 0.4 }}
                              >
                                <Hourglass className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-gray-400" />
                                <span className="mr-2 font-medium">
                                  Previsto para {timestampResult.formatted || "em breve"} {/* Usa a string formatada */}
                                </span>
                                <span>{subEventText}</span>
                              </motion.div>
                            );
                          }
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Botão de Reagendamento (se aplicável) */}
        {currentStatus === 'not_delivered' && (
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <button
              onClick={() => setCheckoutOpen(true)}
              className={`inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r ${colors.gradientFrom} ${colors.gradientTo} text-white font-bold rounded-xl shadow-lg hover:shadow-xl ${colors.shadow} transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105`}
            >
              <Calendar className="h-5 w-5 mr-3" />
              Agendar Nova Entrega
            </button>
          </motion.div>
        )}

        {/* --- Seção de Ajuda --- */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
            Precisa de Ajuda?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FAQ */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Dúvidas Frequentes</h3>
              <div className="space-y-4">
                <FaqItem
                  question="Qual o prazo de entrega padrão?"
                  answer="Normalmente, a entrega ocorre em até 15 dias úteis após a confirmação do pedido. Se houver reagendamento, a nova tentativa ocorre em até 10 dias úteis."
                  isOpen={activeFaq === 0}
                  onClick={() => setActiveFaq(activeFaq === 0 ? null : 0)}
                />
                <FaqItem
                  question="O que acontece se eu não estiver em casa?"
                  answer="Faremos uma tentativa de entrega. Se não for possível, o status será atualizado para 'Entrega Não Realizada' e você poderá agendar uma nova tentativa gratuitamente através desta página."
                  isOpen={activeFaq === 1}
                  onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
                />
                <FaqItem
                  question="Posso alterar o endereço de entrega?"
                  answer="Após a finalização do pedido, não é possível alterar o endereço de entrega por questões de segurança. Caso precise, entre em contato conosco."
                  isOpen={activeFaq === 2}
                  onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
                />
              </div>
            </div>

            {/* Contato */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Entre em Contato</h3>
              <div className="space-y-4">
                <a href="mailto:suporte@viaforteexpress.com" className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors duration-200 group">
                  <Mail className="h-6 w-6 mr-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">E-mail</p>
                    <p className="text-sm text-gray-600 group-hover:text-blue-700">suporte@viaforteexpress.com</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                </a>
                <a href="tel:+5511999998888" className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors duration-200 group">
                  <PhoneCall className="h-6 w-6 mr-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Telefone</p>
                    <p className="text-sm text-gray-600 group-hover:text-blue-700">(11) 987643-5467</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                </a>
              </div>
            </div>
          </div>
        </div>

      </motion.div>

      {/* Modal de Checkout para Reagendamento */}
      {order && (
        <RedeliveryCheckout
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          trackingCode={order.tracking_code}
          onSuccess={() => {
            console.log('Reagendamento concluído, atualizando dados...');
            setCheckoutOpen(false);
            // Forçar refetch com invalidação de cache
            refetch().then(() => {
              console.log('Dados atualizados após reagendamento');
            }).catch((err: Error) => {
              console.error('Erro ao atualizar dados após reagendamento:', err);
            });
          }}
        />
      )}

      {/* Notificação Toast (Exemplo) */}
      {/* Notificação Toast (Exemplo) */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            className="fixed bottom-5 right-5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3 z-[9999] max-w-sm"
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Info className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">Acompanhe seu pedido em tempo real!</p>
            <button
              onClick={() => setShowNotification(false)}
              className="absolute -top-2 -right-2 bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors duration-200"
              aria-label="Fechar notificação"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

