// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Package,
  TrendingUp,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  differenceInDays,
  addDays,
  parse,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient';
// ✅ Removido import vulnerável - usando apenas supabase (ANON_KEY) + RLS
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
// import Button from '../components/ui/Button'; // Não usado se estiver atualizando automaticamente
import { formatCurrency } from '../utils/format';
import { Order, OfferEmailLog } from '../types';

interface DailyMetrics {
  date: string; // String de data formatada para o eixo do gráfico
  orders: number;
  revenue: number; // centavos
}

interface DashboardData {
  // Estatísticas de todos os tempos (podem ser mantidas se necessário para comparação, ou removidas se os cards forem puramente baseados no período)
  // totalOrdersAllTime: number;
  // deliveredOrdersAllTime: number;
  // totalRevenueAllTime: number; // centavos
  // emailsSentAllTime: number;

  // Estatísticas específicas do período para os cards
  totalOrdersInPeriod: number;
  deliveredOrdersInPeriod: number;
  totalRevenueInPeriod: number; // centavos
  emailsSentInPeriod: number;

  // Estatísticas com intervalo de datas para os gráficos
  dailyMetrics: DailyMetrics[];
}

const DATE_FORMAT_INPUT = 'yyyy-MM-dd';
const DATE_FORMAT_DISPLAY = 'dd/MM/yy';
const DATE_FORMAT_CHART_AXIS = 'EEE, dd/MM';
const MAX_RECORDS_LIMIT = 50000; // Limite para consultas Supabase

export default function Dashboard() {
  console.log('🏛️ DEBUG [ADMIN Dashboard] Componente Dashboard (Admin) foi renderizado!');
  
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(() =>
    format(subDays(new Date(), 6), DATE_FORMAT_INPUT)
  );
  const [endDate, setEndDate] = useState(() =>
    format(new Date(), DATE_FORMAT_INPUT)
  );

  useEffect(() => {
    const ordersChannel = supabase
      .channel('dashboard-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => queryClient.invalidateQueries({ queryKey: ['dashboardMetrics', startDate, endDate] })
      )
      .subscribe();

    const emailsChannel = supabase
      .channel('dashboard-email_logs-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_logs' },
        () => queryClient.invalidateQueries({ queryKey: ['dashboardMetrics', startDate, endDate] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(emailsChannel);
    };
  }, [queryClient, startDate, endDate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardMetrics', startDate, endDate],
    queryFn: async () => {
      try {
        console.log('🔍 [DASHBOARD PRINCIPAL] Buscando métricas do dashboard...');
        console.log('📅 Período solicitado:', startDate, 'até', endDate);
        const refDate = new Date(); // Data de referência para análise
        const parsedStartDate = startOfDay(parse(startDate, DATE_FORMAT_INPUT, refDate));
        const parsedEndDate = endOfDay(parse(endDate, DATE_FORMAT_INPUT, refDate));
        
        console.log('📅 Datas parseadas:');
        console.log('- Start:', parsedStartDate.toISOString());
        console.log('- End:', parsedEndDate.toISOString());
        console.log('🔢 Limite aplicado:', MAX_RECORDS_LIMIT);

        // 1. Buscar TODOS os Pedidos usando paginação automática (resolver limite de 1000 do Supabase)
        console.log('🔄 [PAGINAÇÃO] Iniciando busca paginada de pedidos...');
        let ordersInDateRange: Order[] = [];
        let hasMore = true;
        let pageCount = 0;
        const pageSize = 1000; // Tamanho da página para paginação

        while (hasMore && pageCount < 100) { // Limite de segurança de 100 páginas (100k registros max)
          const offset = pageCount * pageSize;
          console.log(`📄 [PÁGINA ${pageCount + 1}] Buscando registros ${offset + 1} a ${offset + pageSize}...`);

          const { data: pageData, error: pageError } = await supabase
            .from('orders')
            .select('created_at, amount, payment_status, status')
            .gte('created_at', parsedStartDate.toISOString())
            .lte('created_at', parsedEndDate.toISOString())
            .order('created_at', { ascending: true })
            .range(offset, offset + pageSize - 1);

          if (pageError) {
            console.error('❌ Erro na paginação:', pageError);
            throw pageError;
          }

          const pageResults = (pageData || []) as Order[];
          console.log(`📊 [PÁGINA ${pageCount + 1}] Encontrados ${pageResults.length} registros`);

          if (pageResults.length === 0) {
            console.log('🏁 [PAGINAÇÃO] Fim dos dados - página vazia');
            hasMore = false;
          } else {
            ordersInDateRange = [...ordersInDateRange, ...pageResults];
            
            // Se retornou menos que o tamanho da página, chegamos ao fim
            if (pageResults.length < pageSize) {
              console.log('🏁 [PAGINAÇÃO] Fim dos dados - página incompleta');
              hasMore = false;
            }
          }

          pageCount++;
        }

        console.log('📊 [RESULTADO PAGINAÇÃO] Total de pedidos encontrados:', ordersInDateRange.length);
        console.log('📊 [PÁGINAS PROCESSADAS]:', pageCount);
        console.log('📊 [PRIMEIRO PEDIDO]:', ordersInDateRange[0]?.created_at);
        console.log('📊 [ÚLTIMO PEDIDO]:', ordersInDateRange[ordersInDateRange.length - 1]?.created_at);
        
        if (pageCount >= 100) {
          console.warn('⚠️ [ALERTA] Atingiu o limite de segurança de 100 páginas - dados podem estar truncados!');
        }

        // 2. Buscar Logs de Email dentro do intervalo de datas selecionado
        const { data: emailsInDateRangeData, error: rangeEmailsError } = await supabase
          .from('log_offer_emails')
          .select('sent_at', { count: 'exact' }) // Precisamos apenas da contagem
          .gte('sent_at', parsedStartDate.toISOString())
          .lte('sent_at', parsedEndDate.toISOString());
        if (rangeEmailsError) throw rangeEmailsError;
        const emailsSentInPeriod = Number(emailsInDateRangeData?.length || 0);

        // 3. Calcular Estatísticas Resumidas Específicas do Período de ordersInDateRange
        const totalOrdersInPeriod = ordersInDateRange.length;

        const deliveredOrdersInPeriod = ordersInDateRange.filter(
          (o) => o.status === 'delivered'
        ).length;

        const paidOrders = ordersInDateRange.filter((o) => o.payment_status === 'paid');
        const totalRevenueInPeriod = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
        
        console.log('💰 [CÁLCULOS DE RECEITA]');
        console.log('- Total de pedidos no período:', totalOrdersInPeriod);
        console.log('- Pedidos entregues:', deliveredOrdersInPeriod);
        console.log('- Pedidos pagos:', paidOrders.length);
        console.log('- Receita total (centavos):', totalRevenueInPeriod);
        console.log('- Receita total (reais):', (totalRevenueInPeriod / 100).toFixed(2));
        
        // Mostrar algumas amostras de valores para debug
        if (paidOrders.length > 0) {
          console.log('📊 [AMOSTRAS DE VALORES]');
          paidOrders.slice(0, 5).forEach((order, i) => {
            console.log(`  ${i+1}. Data: ${order.created_at}, Valor: ${order.amount} centavos (R$ ${((order.amount || 0) / 100).toFixed(2)})`);
          });
        }

        // 4. Processar pedidos com intervalo de datas para calcular dailyMetrics para os gráficos
        const dailyMetrics: DailyMetrics[] = [];
        const numberOfDays = differenceInDays(parsedEndDate, parsedStartDate) + 1;

        if (numberOfDays > 0 && numberOfDays < 366) { // Reduzido para evitar processamento excessivo
          for (let i = 0; i < numberOfDays; i++) {
            const currentDate = addDays(parsedStartDate, i);
            const dayStart = startOfDay(currentDate).toISOString();
            const dayEnd = endOfDay(currentDate).toISOString();

            const ordersForDay = ordersInDateRange.filter(
              (o) => o.created_at >= dayStart && o.created_at <= dayEnd
            );

            const revenueForDay = ordersForDay
              .filter((o) => o.payment_status === 'paid')
              .reduce((sum, o) => sum + (o.amount || 0), 0);

            dailyMetrics.push({
              date: format(currentDate, DATE_FORMAT_CHART_AXIS, { locale: ptBR }),
              orders: ordersForDay.length,
              revenue: revenueForDay,
            });
          }
        }

        console.log('Métricas do dashboard carregadas com sucesso');
        return {
          totalOrdersInPeriod,
          deliveredOrdersInPeriod,
          totalRevenueInPeriod,
          emailsSentInPeriod,
          dailyMetrics,
        };
      } catch (error) {
        console.error('Erro ao buscar métricas do dashboard:', error);
        throw error;
      }
    },
    enabled: !!startDate && !!endDate,
    staleTime: 60000, // 1 minuto
    gcTime: 300000, // 5 minutos (anteriormente chamado cacheTime)
    retry: 1, // Limitar tentativas de retry
    refetchOnWindowFocus: false, // Desativar refetch automático ao focar na janela
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-indigo-600">Carregando métricas...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Erro ao carregar métricas</h3>
        <p className="mt-2 text-sm text-red-700">{error.message}</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboardMetrics', startDate, endDate] })}
          className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-700">Nenhum dado disponível para o período selecionado.</p>
      </div>
    );
  }

  // Extrair dados com valores padrão para evitar erros de TypeScript
  const totalOrdersInPeriod = data?.totalOrdersInPeriod || 0;
  const deliveredOrdersInPeriod = data?.deliveredOrdersInPeriod || 0;
  const totalRevenueInPeriod = data?.totalRevenueInPeriod || 0;
  const emailsSentInPeriod = data?.emailsSentInPeriod || 0;
  const dailyMetrics = data?.dailyMetrics || [];

  const deliveryRateInPeriod = totalOrdersInPeriod > 0
    ? `${Math.round((deliveredOrdersInPeriod / totalOrdersInPeriod) * 100)}%`
    : '0%';

  const periodLabel = startDate && endDate
    ? `(${format(parse(startDate, DATE_FORMAT_INPUT, new Date()), DATE_FORMAT_DISPLAY)} - ${format(parse(endDate, DATE_FORMAT_INPUT, new Date()), DATE_FORMAT_DISPLAY)})`
    : '(Período)';


  const summaryStats = [
    {
      name: `Faturamento ${periodLabel}`,
      value: formatCurrency(totalRevenueInPeriod / 100),
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      name: `Total de Pedidos ${periodLabel}`,
      value: (totalOrdersInPeriod || 0).toLocaleString('pt-BR'),
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      name: `Taxa de Entrega ${periodLabel}`,
      value: deliveryRateInPeriod,
      icon: TrendingUp,
      color: 'bg-indigo-500',
    },
    {
      name: `Emails Enviados ${periodLabel}`,
      value: (emailsSentInPeriod || 0).toLocaleString('pt-BR'),
      icon: Mail,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* Título */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="mt-1 text-sm text-gray-500">
            Métricas e indicadores de desempenho.
          </p>
        </div>
      </div>

      {/* Filtros de Data */}
      <div className="flex flex-col sm:flex-row gap-4 items-end p-4 border rounded-lg bg-gray-50">
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Data Inicial
          </label>
          <Input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            Data Final
          </label>
          <Input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
            className="w-full"
            min={startDate} // Impedir que a data final seja anterior à data inicial
          />
        </div>
        <p className="text-xs text-gray-500 sm:self-end sm:mb-2">
          Os gráficos serão atualizados automaticamente.
        </p>
      </div>

      {/* Cards de Métricas Gerais */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {/* O indicador de tendência pode ser adicionado de volta se a lógica de comparação for implementada */}
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    {stat.name}
                  </h3>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume de Pedidos */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Volume de Pedidos</h2>
            <p className="text-sm text-gray-500">
              {startDate && endDate
                ? `Período: ${format(parse(startDate, DATE_FORMAT_INPUT, new Date()), DATE_FORMAT_DISPLAY)} - ${format(parse(endDate, DATE_FORMAT_INPUT, new Date()), DATE_FORMAT_DISPLAY)}`
                : 'Selecione um período'}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" tickFormatter={(tick) => tick.split(',')[0]} />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Pedidos']}
                  labelFormatter={label => `Data: ${label.split(', ')[1] || label}`}
                />
                <Bar dataKey="orders" name="Pedidos" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Receita no Período */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Receita no Período</h2>
            <p className="text-sm text-gray-500">
              {startDate && endDate
                ? `Período: ${format(parse(startDate, DATE_FORMAT_INPUT, new Date()), DATE_FORMAT_DISPLAY)} - ${format(parse(endDate, DATE_FORMAT_INPUT, new Date()), DATE_FORMAT_DISPLAY)}`
                : 'Selecione um período'}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" tickFormatter={(tick) => tick.split(',')[0]} />
                <YAxis stroke="#6B7280" tickFormatter={(value) => formatCurrency(value / 100)} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value / 100), 'Receita']}
                  labelFormatter={label => `Data: ${label.split(', ')[1] || label}`}
                />
                <Bar dataKey="revenue" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
