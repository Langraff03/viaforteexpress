import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Package, Plus, TrendingUp, Calendar, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { useAuth } from '../lib/auth';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
export default function FreelancerDashboard() {
    console.log('💼 DEBUG [FREELANCER Dashboard] Componente FreelancerDashboard foi renderizado!');
    const { user } = useAuth();
    // Buscar estatísticas do freelancer
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['freelancer-stats', user?.id],
        queryFn: async () => {
            if (!user?.id)
                throw new Error('Usuário não autenticado');
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
            if (!user?.id)
                throw new Error('Usuário não autenticado');
            const { data, error } = await supabase
                .from('orders')
                .select('id, tracking_code, customer_name, customer_email, created_at, status')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false })
                .limit(5);
            if (error)
                throw error;
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
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-900", children: ["Ol\u00E1, ", user?.name || user?.email?.split('@')[0], "! \uD83D\uDC4B"] }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Bem-vindo ao seu painel de controle." })] }), _jsxs(Link, { to: "/freelancer/new-order", className: "inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Criar Novo Pedido"] })] }), _jsx("div", { className: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4", children: summaryStats.map((stat) => {
                    const Icon = stat.icon;
                    return (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `flex-shrink-0 p-3 rounded-md ${stat.color}`, children: _jsx(Icon, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500", children: stat.name }), _jsx("p", { className: "mt-1 text-2xl font-semibold text-gray-900", children: statsLoading ? '...' : stat.value.toLocaleString('pt-BR') })] })] }) }) }, stat.name));
                }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h2", { className: "text-lg font-medium text-gray-900", children: "A\u00E7\u00F5es R\u00E1pidas" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs(Link, { to: "/freelancer/new-order", className: "flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors group", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(Plus, { className: "w-8 h-8 text-emerald-600" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900 group-hover:text-emerald-700", children: "Criar Novo Pedido" }), _jsx("p", { className: "text-sm text-gray-500", children: "Gere um novo c\u00F3digo de rastreamento" })] })] }), _jsx(ArrowRight, { className: "w-5 h-5 text-gray-400 ml-auto group-hover:text-emerald-600" })] }), _jsxs(Link, { to: "/freelancer/orders", className: "flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors group", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(Package, { className: "w-8 h-8 text-emerald-600" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900 group-hover:text-emerald-700", children: "Ver Todos os Pedidos" }), _jsx("p", { className: "text-sm text-gray-500", children: "Hist\u00F3rico completo de rastreamentos" })] })] }), _jsx(ArrowRight, { className: "w-5 h-5 text-gray-400 ml-auto group-hover:text-emerald-600" })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Pedidos Recentes" }), _jsx(Link, { to: "/freelancer/orders", className: "text-sm text-emerald-600 hover:text-emerald-700", children: "Ver todos" })] }) }), _jsx(CardContent, { children: ordersLoading ? (_jsxs("div", { className: "flex items-center justify-center h-32", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" }), _jsx("span", { className: "ml-3 text-emerald-600", children: "Carregando..." })] })) : recentOrders && recentOrders.length > 0 ? (_jsx("div", { className: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "C\u00F3digo" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Cliente" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Data" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: recentOrders.map((order) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children: order.tracking_code }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: order.customer_name }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: order.customer_email }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: format(new Date(order.created_at), 'dd/MM/yy HH:mm', { locale: ptBR }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", children: [_jsx(CheckCircle, { className: "w-3 h-3 mr-1" }), "Enviado"] }) })] }, order.id))) })] }) })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx(Package, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Nenhum pedido ainda" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Comece criando seu primeiro pedido de rastreamento." }), _jsx("div", { className: "mt-6", children: _jsxs(Link, { to: "/freelancer/new-order", className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Criar Primeiro Pedido"] }) })] })) })] })] }));
}
