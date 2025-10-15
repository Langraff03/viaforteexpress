import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, Filter, Plus, Eye, Mail, CheckCircle, Clock, AlertCircle, Download, ArrowUpDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { useAuth } from '../lib/auth';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
export default function FreelancerOrders() {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    // Buscar pedidos do freelancer
    const { data: orders, isLoading, error, refetch } = useQuery({
        queryKey: ['freelancer-orders', user?.id, searchTerm, statusFilter, sortField, sortDirection],
        queryFn: async () => {
            if (!user?.id)
                throw new Error('Usuário não autenticado');
            let query = supabase
                .from('orders')
                .select('id, tracking_code, customer_name, customer_email, created_at, status')
                .eq('created_by', user.id);
            // Filtro por status
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }
            // Filtro por pesquisa
            if (searchTerm) {
                query = query.or(`tracking_code.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`);
            }
            // Ordenação
            query = query.order(sortField, { ascending: sortDirection === 'asc' });
            const { data, error } = await query;
            if (error)
                throw error;
            // Log para debug do status dos pedidos
            console.log('📊 Status dos pedidos carregados:', data?.map(order => ({
                id: order.id,
                tracking_code: order.tracking_code,
                status: order.status,
                customer_name: order.customer_name
            })));
            return data || [];
        },
        enabled: !!user?.id,
    });
    // Função para alterar ordenação
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortField(field);
            setSortDirection('desc');
        }
    };
    // Filtrar e paginar os dados
    const filteredOrders = orders || [];
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);
    // Função para reenviar email
    const handleResendEmail = async (orderId) => {
        try {
            // Aqui você pode implementar a lógica para reenviar o email
            console.log('Reenviando email para pedido:', orderId);
            // Implementar chamada para API ou função de reenvio
        }
        catch (error) {
            console.error('Erro ao reenviar email:', error);
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'sent':
                return (_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", children: [_jsx(CheckCircle, { className: "w-3 h-3 mr-1" }), "Enviado"] }));
            case 'delivered':
                return (_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800", children: [_jsx(Package, { className: "w-3 h-3 mr-1" }), "Entregue"] }));
            default:
                return (_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), "Pendente"] }));
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Meus Pedidos" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Gerencie todos os seus pedidos de rastreamento" })] }), _jsxs(Link, { to: "/freelancer/new-order", className: "inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Novo Pedido"] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "w-5 h-5 absolute left-3 top-3 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Pesquisar por c\u00F3digo, nome ou email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { className: "w-5 h-5 text-gray-400" }), _jsxs("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), className: "border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent", children: [_jsx("option", { value: "all", children: "Todos os Status" }), _jsx("option", { value: "pending", children: "Pendentes" }), _jsx("option", { value: "sent", children: "Enviados" }), _jsx("option", { value: "delivered", children: "Entregues" })] })] })] }) }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h2", { className: "text-lg font-medium text-gray-900", children: [filteredOrders.length, " pedido", filteredOrders.length !== 1 ? 's' : ''] }), _jsxs("button", { onClick: () => refetch(), className: "inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50", children: [_jsx(Download, { className: "w-4 h-4 mr-1" }), "Atualizar"] })] }) }), _jsx(CardContent, { children: isLoading ? (_jsxs("div", { className: "flex items-center justify-center h-32", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" }), _jsx("span", { className: "ml-3 text-emerald-600", children: "Carregando pedidos..." })] })) : error ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(AlertCircle, { className: "mx-auto h-12 w-12 text-red-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Erro ao carregar pedidos" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Tente novamente em alguns instantes." }), _jsx("button", { onClick: () => refetch(), className: "mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700", children: "Tentar Novamente" })] })) : paginatedOrders.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-300", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100", onClick: () => handleSort('tracking_code'), children: _jsxs("div", { className: "flex items-center", children: ["C\u00F3digo", _jsx(ArrowUpDown, { className: "w-4 h-4 ml-1" })] }) }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100", onClick: () => handleSort('customer_name'), children: _jsxs("div", { className: "flex items-center", children: ["Cliente", _jsx(ArrowUpDown, { className: "w-4 h-4 ml-1" })] }) }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100", onClick: () => handleSort('created_at'), children: _jsxs("div", { className: "flex items-center", children: ["Data", _jsx(ArrowUpDown, { className: "w-4 h-4 ml-1" })] }) }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: paginatedOrders.map((order) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children: order.tracking_code }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: order.customer_name }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: order.customer_email }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: format(new Date(order.created_at), 'dd/MM/yy HH:mm', { locale: ptBR }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: getStatusBadge(order.status) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx("a", { href: `https://rastreio.viaforteexpress.com/tracking/${order.tracking_code}`, target: "_blank", rel: "noopener noreferrer", className: "text-emerald-600 hover:text-emerald-900", title: "Ver rastreamento", children: _jsx(Eye, { className: "w-4 h-4" }) }), order.status === 'created' && (_jsx("button", { onClick: () => handleResendEmail(order.id), className: "text-blue-600 hover:text-blue-900", title: "Reenviar email", children: _jsx(Mail, { className: "w-4 h-4" }) }))] }) })] }, order.id))) })] }) }), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between mt-6", children: [_jsxs("div", { className: "text-sm text-gray-700", children: ["Mostrando ", startIndex + 1, " a ", Math.min(startIndex + itemsPerPage, filteredOrders.length), " de ", filteredOrders.length, " resultados"] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => setCurrentPage(Math.max(1, currentPage - 1)), disabled: currentPage === 1, className: "px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed", children: "Anterior" }), _jsxs("span", { className: "px-3 py-1 text-sm text-gray-700", children: ["P\u00E1gina ", currentPage, " de ", totalPages] }), _jsx("button", { onClick: () => setCurrentPage(Math.min(totalPages, currentPage + 1)), disabled: currentPage === totalPages, className: "px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed", children: "Pr\u00F3xima" })] })] }))] })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx(Package, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: searchTerm || statusFilter !== 'all' ? 'Nenhum pedido encontrado' : 'Nenhum pedido ainda' }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: searchTerm || statusFilter !== 'all'
                                        ? 'Tente ajustar os filtros de pesquisa.'
                                        : 'Comece criando seu primeiro pedido de rastreamento.' }), !searchTerm && statusFilter === 'all' && (_jsx("div", { className: "mt-6", children: _jsxs(Link, { to: "/freelancer/new-order", className: "inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Criar Primeiro Pedido"] }) }))] })) })] })] }));
}
