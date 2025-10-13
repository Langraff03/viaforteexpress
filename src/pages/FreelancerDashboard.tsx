import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  TrendingUp,
  Calendar,
  Mail,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { useAuth } from '../lib/auth';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
}

interface RecentOrder {
  id: string;
  tracking_code: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  status: string;
}

export default function FreelancerDashboard() {
  console.log('💼 DEBUG [FREELANCER Dashboard] Componente FreelancerDashboard foi renderizado!');
  
  const { user } = useAuth();

  // Buscar estatísticas do freelancer
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['freelancer-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      const startOfThisWeek = startOfWeek(now, { locale: ptBR });
      const endOfThisWeek = endOfWeek(now, { locale: ptBR });
      
      const startOfThisMonth = startOfMonth(now);
      const endOfThisMonth = endOfMonth(now);

      // Total de pedidos
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id);

      // Pedidos de hoje
      const { count: todayOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString());

      // Pedidos desta semana
      const { count: weekOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .gte('created_at', startOfThisWeek.toISOString())
        .lte('created_at', endOfThisWeek.toISOString());

      // Pedidos deste mês
      const { count: monthOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .gte('created_at', startOfThisMonth.toISOString())
        .lte('created_at', endOfThisMonth.toISOString());

      return {
        totalOrders: totalOrders || 0,
        todayOrders: todayOrders || 0,
        weekOrders: weekOrders || 0,
        monthOrders: monthOrders || 0,
      };
    },
    enabled: !!user?.id,
  });

  // Buscar pedidos recentes
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['freelancer-recent-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('orders')
        .select('id, tracking_code, customer_name, customer_email, created_at, status')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const summaryStats = [
    {
      name: 'Total de Pedidos',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      name: 'Pedidos Hoje',
      value: stats?.todayOrders || 0,
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      name: 'Esta Semana',
      value: stats?.weekOrders || 0,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      name: 'Este Mês',
      value: stats?.monthOrders || 0,
      icon: Clock,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-8">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {user?.name || user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Bem-vindo ao seu painel de controle.
            </p>
          </div>
          <Link
            to="/freelancer/new-order"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Novo Pedido
          </Link>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-500">
                        {stat.name}
                      </h3>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">
                        {statsLoading ? '...' : stat.value.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Ações Rápidas</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                to="/freelancer/new-order"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Plus className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-emerald-700">
                      Criar Novo Pedido
                    </h3>
                    <p className="text-sm text-gray-500">
                      Gere um novo código de rastreamento
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-emerald-600" />
              </Link>
              
              <Link
                to="/freelancer/orders"
                className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-emerald-700">
                      Ver Todos os Pedidos
                    </h3>
                    <p className="text-sm text-gray-500">
                      Histórico completo de rastreamentos
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-emerald-600" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos Recentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Pedidos Recentes</h2>
              <Link
                to="/freelancer/orders"
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                Ver todos
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
                <span className="ml-3 text-emerald-600">Carregando...</span>
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.tracking_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customer_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(order.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Enviado
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pedido ainda</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Comece criando seu primeiro pedido de rastreamento.
                </p>
                <div className="mt-6">
                  <Link
                    to="/freelancer/new-order"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Pedido
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}