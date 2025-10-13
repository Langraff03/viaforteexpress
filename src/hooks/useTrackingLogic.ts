import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS para rastreamento público
import {
  Package,
  Box,
  Calendar,
  Truck,
  XCircle,
  CheckCircle,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';
import { format, addDays, differenceInCalendarDays, addMinutes } from 'date-fns'; // addMinutes importado aqui também
import { ptBR } from 'date-fns/locale';
import { useQuery } from "@tanstack/react-query";
import {
  calculateSubEventTimestamp,
  getEstimatedDeliveryWindow,
  getBaseDateForStatus,
  getRandomItem,
  fakeNames,
  fakeReasons,
  getSimulatedRoute,
} from "../utils/simulationHelpers"; // Ajuste o caminho se necessário
import { secureLog } from '../utils/secureLogger';

// --- Tipos e Interfaces ---

export interface Order {
  id: string;
  tracking_code: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  status: string;
  shipped_at: string | null;
  redelivery_requested: boolean;
  redelivery_date: string | null;
  state?: string | null;
  city?: string | null;
}

export type StepKey =
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'not_delivered'
  | 'redelivery_scheduled'
  | 'out_for_redelivery'
  | 'redelivered';

export interface SubEvent {
  description: string;
  relativeTimestamp: string;
  routeIndex?: number;
}

export interface StepInfo {
  key: StepKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  mainMessage: string;
  subEvents?: SubEvent[];
}

// --- Constantes de Configuração ---

export const STEPS: StepInfo[] = [
  {
    key: "confirmed",
    label: "Pedido Recebido",
    icon: Package,
    mainMessage: "Oba! Recebemos seu pedido. Ele já está sendo preparado com todo o cuidado pela nossa equipe.",
    subEvents: [
      { description: "Recebemos seu pedido!", relativeTimestamp: "created_at" },
      { description: "Pagamento confirmado. Estamos preparando tudo!", relativeTimestamp: "+1h" },
    ],
  },
  {
    key: "processing",
    label: "Em Preparo",
    icon: Box,
    mainMessage: "Estamos a todo vapor na preparação! Logo seu pedido estará pronto para ser embalado.",
    subEvents: [
      { description: "Separação dos produtos iniciada.", relativeTimestamp: "start" },
      { description: "Produtos separados e conferidos.", relativeTimestamp: "+4h" },
    ],
  },
  {
    key: "packed",
    label: "Embalado",
    icon: Box,
    mainMessage: "Tudo pronto e embalado com segurança! Seu pedido já aguarda a coleta para iniciar a viagem até você.",
    subEvents: [
      { description: "Embalagem iniciada.", relativeTimestamp: "start" },
      { description: "Pedido embalado e pronto para envio.", relativeTimestamp: "+2h" },
    ],
  },
  {
    key: "shipped",
    label: "Em Trânsito",
    icon: Truck,
    mainMessage: "Seu pacote iniciou a jornada! Acompanhe as principais paradas enquanto ele viaja até sua cidade.",
    subEvents: [
      { description: "Pedido coletado pela transportadora.", relativeTimestamp: "shipped_at_or_start" },
      { description: "Chegou ao centro de distribuição [HUB_1].", relativeTimestamp: "+12h", routeIndex: 0 },
      { description: "Transferência entre centros de distribuição.", relativeTimestamp: "+24h" },
      { description: "Chegou ao centro de distribuição [HUB_2].", relativeTimestamp: "+48h", routeIndex: 1 },
    ],
  },
  {
    key: "out_for_delivery",
    label: "Saiu para Entrega",
    icon: Truck,
    mainMessage: "Boas notícias, [Nome Cliente]! Seu pedido saiu para entrega hoje com o(a) entregador(a) [Nome Fictício].",
    subEvents: [
      { description: "Rota de entrega definida.", relativeTimestamp: "start_07:00" },
      { description: "Entregador(a) [Nome Fictício] saiu com seu pedido.", relativeTimestamp: "+1h_08:00" },
      { description: "Entregador(a) está na sua região.", relativeTimestamp: "+4h_11:00" },
    ],
  },
  {
    key: "not_delivered",
    label: "Entrega Não Realizada",
    icon: XCircle,
    mainMessage: "Poxa, nosso entregador esteve aí, mas não conseguiu concluir a entrega. Não se preocupe, reagendar é fácil e rápido!",
    subEvents: [
      { description: "Tentativa realizada às [Hora Fictícia].", relativeTimestamp: "start" },
      { description: "Motivo: [Motivo Fictício].", relativeTimestamp: "+5m" },
    ],
  },
  {
    key: "redelivery_scheduled",
    label: "Reentrega Agendada",
    icon: Calendar,
    mainMessage: "Combinado! Sua nova tentativa de entrega está agendada para [Data]. Avisaremos assim que sair novamente.",
    subEvents: [
      { description: "Nova tentativa agendada para [Data].", relativeTimestamp: "redelivery_date" },
    ],
  },
  {
    key: "out_for_redelivery",
    label: "Saiu p/ Reentrega",
    icon: Truck,
    mainMessage: "Lá vamos nós de novo, [Nome Cliente]! Seu pedido saiu para a nova tentativa de entrega com o(a) entregador(a) [Nome Fictício].",
    subEvents: [
      { description: "Saiu para nova tentativa de entrega.", relativeTimestamp: "start_08:00" },
      { description: "Entregador(a) [Nome Fictício] está a caminho novamente.", relativeTimestamp: "+1h_09:00" },
    ],
  },
  {
    key: "delivered",
    label: "Entregue",
    icon: CheckCircle,
    mainMessage: "Seu pedido foi entregue com sucesso! Agradecemos a preferência.",
  },
  {
    key: "redelivered",
    label: "Reentregue",
    icon: ShieldCheck,
    mainMessage: "Reentrega concluída com sucesso! Esperamos que aproveite seu pedido.",
  },
];

export const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string; border: string; gradientFrom: string; gradientTo: string; shadow: string; lightBg: string; progressBar: string }> = {
  in_progress: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'text-blue-500',
    border: 'border-blue-200',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-600',
    shadow: 'shadow-blue-400/30',
    lightBg: 'bg-blue-100/50',
    progressBar: 'bg-blue-500'
  },
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: 'text-emerald-500',
    border: 'border-emerald-200',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-green-600',
    shadow: 'shadow-emerald-400/30',
    lightBg: 'bg-emerald-100/50',
    progressBar: 'bg-emerald-500'
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: 'text-amber-500',
    border: 'border-amber-200',
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-orange-500',
    shadow: 'shadow-amber-400/30',
    lightBg: 'bg-amber-100/50',
    progressBar: 'bg-amber-500'
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-500',
    border: 'border-red-200',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-rose-600',
    shadow: 'shadow-red-400/30',
    lightBg: 'bg-red-100/50',
    progressBar: 'bg-red-500'
  },
};

// --- Funções Auxiliares de Lógica ---

// Função movida para ser exportada pelo hook
function getStatusType(status: StepKey): keyof typeof STATUS_COLORS {
  if (status === 'delivered' || status === 'redelivered') return 'success';
  if (status === 'not_delivered') return 'error';
  if (['redelivery_scheduled', 'out_for_redelivery'].includes(status)) return 'warning';
  return 'in_progress';
}

function calculateSimulatedStatus(order: Order | undefined | null): StepKey {
  if (!order || !order.created_at || isNaN(new Date(order.created_at).getTime())) {
    return 'confirmed';
  }

  const now = new Date();
  const createdAt = new Date(order.created_at);
  const shippedAt = order.shipped_at && !isNaN(new Date(order.shipped_at).getTime()) ? new Date(order.shipped_at) : null;
  const redeliveryDate = order.redelivery_date && !isNaN(new Date(order.redelivery_date).getTime()) ? new Date(order.redelivery_date) : null;

  console.log('Calculando status para pedido:', {
    tracking_code: order.tracking_code,
    status: order.status,
    redelivery_requested: order.redelivery_requested,
    redelivery_date: order.redelivery_date,
    now: now.toISOString()
  });

  if (order.status === 'failed_delivery' && !order.redelivery_requested) {
    console.log('Status: not_delivered (entrega falhou, sem reagendamento)');
    return 'not_delivered';
  }

  if (order.redelivery_requested && redeliveryDate) {
    const daysSinceRedeliveryRequest = differenceInCalendarDays(now, redeliveryDate);
    console.log('Reagendamento encontrado, dias desde solicitação:', daysSinceRedeliveryRequest);

    if (daysSinceRedeliveryRequest <= 1) {
      console.log('Status: redelivery_scheduled');
      return 'redelivery_scheduled';
    }
    if (daysSinceRedeliveryRequest <= 9) {
      console.log('Status: out_for_redelivery');
      return 'out_for_redelivery';
    }
    console.log('Status: not_delivered (reagendamento expirado)');
    return 'not_delivered';
  }

  const daysSinceCreation = differenceInCalendarDays(now, createdAt);

  if (daysSinceCreation >= 15) {
    return 'not_delivered';
  }

  if (shippedAt) {
    const daysSinceShipped = differenceInCalendarDays(now, shippedAt);
    const outForDeliveryStartDayRelative = 6;
    const deliveryFailDayRelative = 10;

    if (daysSinceShipped < outForDeliveryStartDayRelative) return 'shipped';
    if (daysSinceShipped < deliveryFailDayRelative) return 'out_for_delivery';
    return 'not_delivered';
  }

  if (daysSinceCreation <= 0) return 'confirmed';
  if (daysSinceCreation <= 2) return 'processing';
  if (daysSinceCreation <= 4) return 'packed';
  if (daysSinceCreation <= 10) return 'shipped';
  if (daysSinceCreation <= 14) return 'out_for_delivery';

  return 'not_delivered';
}

function calculateVisibleSteps(currentStatus: StepKey): StepInfo[] {
  const allSteps = STEPS; // Contém todos os passos, incluindo delivered/redelivered

  // Encontra os índices dos passos chave
  const notDeliveredIndex = allSteps.findIndex(step => step.key === 'not_delivered');
  const redeliveryScheduledIndex = allSteps.findIndex(step => step.key === 'redelivery_scheduled');
  const outForRedeliveryIndex = allSteps.findIndex(step => step.key === 'out_for_redelivery');
  const redeliveredIndex = allSteps.findIndex(step => step.key === 'redelivered');
  const outForDeliveryIndex = allSteps.findIndex(step => step.key === 'out_for_delivery');
  const deliveredIndex = allSteps.findIndex(step => step.key === 'delivered');

  let stepsToShow: StepInfo[] = [];

  // Caminho normal até a falha na entrega
  const normalPathUntilFailure = notDeliveredIndex !== -1 ? allSteps.slice(0, notDeliveredIndex + 1) : [];
  const normalPathUntilDelivery = outForDeliveryIndex !== -1 ? allSteps.slice(0, outForDeliveryIndex + 1) : [];


  if (currentStatus === 'delivered') {
    if (deliveredIndex !== -1) {
      stepsToShow = [...normalPathUntilDelivery, allSteps[deliveredIndex]];
    } else {
      stepsToShow = normalPathUntilDelivery;
    }
  } else if (currentStatus === 'redelivered') {
    if (redeliveryScheduledIndex !== -1 && outForRedeliveryIndex !== -1 && redeliveredIndex !== -1) {
      stepsToShow = [
        ...normalPathUntilFailure,
        allSteps[redeliveryScheduledIndex],
        allSteps[outForRedeliveryIndex],
        allSteps[redeliveredIndex],
      ];
    } else { // Fallback se algum índice não for encontrado
      stepsToShow = normalPathUntilFailure;
    }
  } else if (currentStatus === 'out_for_redelivery') {
    if (redeliveryScheduledIndex !== -1 && outForRedeliveryIndex !== -1) {
      stepsToShow = [
        ...normalPathUntilFailure,
        allSteps[redeliveryScheduledIndex],
        allSteps[outForRedeliveryIndex],
      ];
    } else {
      stepsToShow = normalPathUntilFailure;
    }
  } else if (currentStatus === 'redelivery_scheduled') {
    if (redeliveryScheduledIndex !== -1) {
      stepsToShow = [...normalPathUntilFailure, allSteps[redeliveryScheduledIndex]];
    } else {
      stepsToShow = normalPathUntilFailure;
    }
  } else if (currentStatus === 'not_delivered') {
    stepsToShow = normalPathUntilFailure;
  } else {
    // Para status normais antes de 'not_delivered'
    const currentIndex = allSteps.findIndex(step => step.key === currentStatus);
    if (currentIndex !== -1 && (notDeliveredIndex === -1 || currentIndex < notDeliveredIndex)) {
      // Garante que não ultrapasse o ponto de 'not_delivered' se ele existir
      stepsToShow = allSteps.slice(0, currentIndex + 1);
    } else {
      // Fallback para status não mapeados ou após 'not_delivered' sem ser reagendamento
      stepsToShow = normalPathUntilFailure.length > 0 ? normalPathUntilFailure : allSteps.slice(0, currentIndex +1);
    }
  }
  
  // Garante que não haja duplicatas e mantém a ordem (embora a lógica acima deva evitar isso)
  // E remove os passos finais 'delivered'/'redelivered' se não forem o status atual,
  // pois eles são adicionados explicitamente acima quando são o status final.
  return stepsToShow.filter((step, index, self) =>
    index === self.findIndex((s) => s.key === step.key) &&
    (step.key !== 'delivered' || currentStatus === 'delivered') &&
    (step.key !== 'redelivered' || currentStatus === 'redelivered')
  );
}

// --- Hook Principal de Lógica ---

export function useTrackingLogic(code: string | undefined) {
  // Estado para controlar timeout de carregamento
  const [timeoutError, setTimeoutError] = useState<Error | null>(null);
  
  // 1. Busca de Dados
  const {
    data: order,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['order', code],
    queryFn: async () => {
      secureLog.debug('Buscando dados do pedido com código:', code);
      
      // Resetar erro de timeout ao iniciar nova busca
      setTimeoutError(null);
      
      // Se o código não estiver definido, não executa a query
      if (!code) {
        throw new Error('Código de rastreio não fornecido');
      }
      
      try {
        // ✅ Usar supabase (ANON_KEY) + RLS para garantir acesso público seguro aos dados de rastreamento
        // A policy "public_tracking_by_code" permite acesso quando tracking_code não é nulo
        const { data, error } = await supabase
          .from('orders')
          .select('*, city, state') // Row Level Security permite acesso público por tracking_code
          .eq('tracking_code', code)
          .single();

        if (error) {
          secureLog.error("Erro ao buscar pedido:", error);
          // Lança erro específico para "not found"
          if (error.code === 'PGRST116') {
            throw new Error('Pedido não encontrado');
          }
          throw new Error(`Erro ao buscar pedido: ${error.message}`);
        }
        
        if (!data) throw new Error('Pedido não encontrado');
        
        secureLog.debug('Dados do pedido encontrados:', data);
        return data;
      } catch (err) {
        secureLog.error('Erro na busca do pedido:', err);
        throw err;
      }
    },
    enabled: !!code,
    retry: 1,
    staleTime: 60000, // 1 minuto
    gcTime: 300000, // 5 minutos (anteriormente chamado cacheTime)
    refetchOnWindowFocus: false, // Desativar refetch automático ao focar na janela
  });
  
  // Efeito para timeout de carregamento
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (queryLoading) {
      timeoutId = setTimeout(() => {
        secureLog.debug('Timeout de carregamento atingido');
        setTimeoutError(new Error('Tempo limite de carregamento excedido. Tente novamente.'));
      }, 10000); // 10 segundos
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [queryLoading]);
  
  // Combinar erros de query e timeout
  const error = timeoutError || queryError;
  const isLoading = queryLoading && !timeoutError;

  // 2. Cálculos de Estado e Dados Derivados
  const currentStatus = useMemo(() => calculateSimulatedStatus(order), [order]);
  const visibleSteps = useMemo(() => calculateVisibleSteps(currentStatus), [currentStatus]);
  const statusType = useMemo(() => getStatusType(currentStatus), [currentStatus]);
  const currentColors = useMemo(() => STATUS_COLORS[statusType], [statusType]); // Renomeado para clareza

  const originHub = useMemo(() => {
    if (!order || !order.state) return "Centro de Distribuição Nacional";
    const route = getSimulatedRoute(order.state);
    return route[0] || "Centro de Distribuição Nacional";
  }, [order?.state]);

  const destination = useMemo(() => {
    if (!order) return "Destino não informado";
    const city = order.city || "Cidade não informada";
    const state = order.state || "UF";
    return `${city}, ${state}`;
  }, [order?.city, order?.state]);

  const fakeDeliveryPerson = useMemo(() => {
    if (!order) return 'Entregador Padrão';
    return getRandomItem(fakeNames, order.id + '_driver');
  }, [order?.id]);

  const fakeFailureReason = useMemo(() => {
    if (!order) return 'Motivo Padrão';
    return getRandomItem(fakeReasons, order.id + '_reason');
  }, [order?.id]);

  const estimatedWindow = useMemo(() => {
    if ((currentStatus === 'out_for_delivery' || currentStatus === 'out_for_redelivery') && order) {
      const baseDateKey = currentStatus === 'out_for_redelivery' ? 'out_for_redelivery' : 'out_for_delivery';
      const baseDate = getBaseDateForStatus(baseDateKey, order);
      return getEstimatedDeliveryWindow(baseDate);
    }
    return null;
  }, [currentStatus, order]);

  const formattedCreationDate = useMemo(() => {
    return order?.created_at
      ? format(new Date(order.created_at), "d 'de' MMMM, yyyy", { locale: ptBR })
      : '';
  }, [order?.created_at]);

  const daysSinceCreation = useMemo(() => {
    return order?.created_at
      ? differenceInCalendarDays(new Date(), new Date(order.created_at))
      : 0;
  }, [order?.created_at]);

  const estimatedDeliveryDate = useMemo(() => {
    if (!order || !order.created_at) return null;
    let baseDateForEstimate: Date;
    let daysToAdd: number;
    if (order.redelivery_requested && order.redelivery_date) {
      baseDateForEstimate = new Date(order.redelivery_date);
      daysToAdd = 10;
    } else {
      baseDateForEstimate = new Date(order.created_at);
      daysToAdd = 15;
    }
    if (isNaN(baseDateForEstimate.getTime())) return null;
    try {
      return format(addDays(baseDateForEstimate, daysToAdd), "d 'de' MMMM, yyyy", { locale: ptBR });
    } catch { return null; }
  }, [order?.created_at, order?.redelivery_requested, order?.redelivery_date]);

  // 3. Retorno do Hook
  return {
    order,
    isLoading,
    error,
    refetch,
    currentStatus,
    visibleSteps,
    statusType, // Mantido para uso geral se necessário
    colors: currentColors, // Retorna as cores do status atual
    originHub,
    destination,
    fakeDeliveryPerson,
    fakeFailureReason,
    estimatedWindow,
    formattedCreationDate,
    daysSinceCreation,
    estimatedDeliveryDate,
    // Exporta a função e a constante para uso na timeline
    getStatusType, // Função para obter tipo de status de qualquer passo
    STATUS_COLORS, // Constante com todas as cores
  };
}

