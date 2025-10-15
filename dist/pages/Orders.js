import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/pages/Orders.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, ChevronDown, ChevronUp, Eye, Mail, Plus, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { useNavigate } from 'react-router-dom';
import { NewOrderModal } from '../components/ui/NewOrderModal';
export default function Orders() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedAddressFilter, setSelectedAddressFilter] = useState('all');
    const [selectedEmailFilter, setSelectedEmailFilter] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [expandedRows, setExpandedRows] = useState({});
    const [timeoutError, setTimeoutError] = useState(null);
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    // debounce (atraso para evitar múltiplas requisições) searchTerm
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);
    const { data: ordersData, isLoading: queryLoading, isFetching, error: queryError } = useQuery({
        queryKey: ['orders', page, selectedStatus, selectedAddressFilter, selectedEmailFilter, debouncedSearch],
        queryFn: async () => {
            console.log('Buscando pedidos com filtros:', {
                page,
                status: selectedStatus,
                addressFilter: selectedAddressFilter,
                emailFilter: selectedEmailFilter,
                search: debouncedSearch
            });
            // Resetar erro de timeout ao iniciar nova busca
            setTimeoutError(null);
            try {
                // Usar supabase para garantir acesso aos dados
                let query = supabase
                    .from('orders')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range((page - 1) * pageSize, page * pageSize - 1);
                if (selectedStatus !== 'all') {
                    query = query.eq('status', selectedStatus);
                }
                // NOVO: Filtro de endereço
                if (selectedAddressFilter === 'with_address') {
                    query = query.eq('has_shipping_address', true);
                }
                else if (selectedAddressFilter === 'without_address') {
                    query = query.eq('has_shipping_address', false);
                }
                else if (selectedAddressFilter === 'not_validated') {
                    query = query.is('has_shipping_address', null);
                }
                // NOVO: Filtro de email
                if (selectedEmailFilter === 'email_sent') {
                    query = query.eq('email_sent', true);
                }
                else if (selectedEmailFilter === 'email_not_sent') {
                    query = query.or('email_sent.is.null,email_sent.eq.false');
                }
                if (debouncedSearch) {
                    query = query.or(`tracking_code.ilike.%${debouncedSearch}%,customer_name.ilike.%${debouncedSearch}%,customer_email.ilike.%${debouncedSearch}%`);
                }
                const { data, count, error } = await query;
                if (error) {
                    console.error('Erro ao buscar pedidos:', error);
                    throw error;
                }
                console.log(`Encontrados ${count || 0} pedidos`);
                return { data: data ?? [], count: count ?? 0 };
            }
            catch (err) {
                console.error('Erro na busca de pedidos:', err);
                throw err;
            }
        },
        placeholderData: (previousData) => previousData,
        staleTime: 60000, // 1 minuto
        gcTime: 300000, // 5 minutos (anteriormente chamado cacheTime)
        refetchOnWindowFocus: false, // Desativar refetch automático ao focar na janela
        retry: 1,
        retryDelay: 1000
    });
    // Efeito para timeout de carregamento
    useEffect(() => {
        let timeoutId = null;
        if (queryLoading) {
            timeoutId = setTimeout(() => {
                console.log('Timeout de carregamento atingido na página de pedidos');
                setTimeoutError(new Error('Tempo limite de carregamento excedido. Tente novamente.'));
            }, 10000); // 10 segundos
        }
        return () => {
            if (timeoutId)
                clearTimeout(timeoutId);
        };
    }, [queryLoading]);
    // Combinar erros de query e timeout
    const error = timeoutError || queryError;
    const isLoading = queryLoading && !timeoutError;
    const totalPages = Math.ceil((ordersData?.count || 0) / pageSize);
    const orders = ordersData?.data || []; // Tipar explicitamente orders
    function getStatusColor(status) {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }
    function getStatusText(status) {
        switch (status) {
            case 'pending':
                return 'Aguardando';
            case 'processing':
                return 'Em Preparação';
            case 'shipped':
                return 'Em Trânsito';
            case 'delivered':
                return 'Entregue';
            case 'cancelled':
                return 'Cancelado';
            default:
                return status;
        }
    }
    function toggleRow(id) {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    }
    function formatCurrency(value) {
        const formatter = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
        return value ? formatter.format(value / 100) : '—';
    }
    if (isLoading) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-64", children: [_jsx(Loader2, { className: "w-8 h-8 animate-spin text-indigo-600 mb-4" }), _jsx("p", { className: "text-indigo-600", children: "Carregando pedidos..." })] }));
    }
    if (error) {
        return (_jsxs("div", { className: "p-6 bg-red-50 border border-red-200 rounded-lg", children: [_jsx("h3", { className: "text-lg font-medium text-red-800 mb-2", children: "Erro ao carregar pedidos" }), _jsx("p", { className: "text-red-600 mb-4", children: error.message }), _jsx(Button, { variant: "primary", onClick: () => {
                        setTimeoutError(null);
                        queryClient.invalidateQueries({ queryKey: ['orders'] });
                    }, children: "Tentar novamente" })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Pedidos" }), _jsx("p", { className: "text-gray-500", children: "Gerencie e rastreie seus pedidos" })] }), _jsx(Button, { variant: "primary", leftIcon: _jsx(Plus, { className: "w-4 h-4" }), onClick: () => setShowNewOrderModal(true), children: "Novo Pedido" })] }), _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Search, { className: "w-5 h-5 text-gray-400" }) }), _jsx("input", { type: "text", placeholder: "Buscar...", className: "w-full pl-10 pr-3 py-2 border rounded-md focus:ring-indigo-500", value: searchTerm, onChange: e => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                } })] }), _jsxs("select", { className: "border rounded-md px-3 py-2", value: selectedStatus, onChange: e => {
                            setSelectedStatus(e.target.value);
                            setPage(1);
                        }, children: [_jsx("option", { value: "all", children: "Todos os Status" }), _jsx("option", { value: "pending", children: "Pendente" }), _jsx("option", { value: "processing", children: "Em Processamento" }), _jsx("option", { value: "shipped", children: "Enviado" }), _jsx("option", { value: "delivered", children: "Entregue" }), _jsx("option", { value: "cancelled", children: "Cancelado" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("select", { className: "border rounded-md px-3 py-2 text-sm", value: selectedAddressFilter || 'all', onChange: e => {
                                    setSelectedAddressFilter(e.target.value);
                                    setPage(1);
                                }, children: [_jsx("option", { value: "all", children: "Todos Endere\u00E7os" }), _jsx("option", { value: "with_address", children: "Com Endere\u00E7o" }), _jsx("option", { value: "without_address", children: "Sem Endere\u00E7o" }), _jsx("option", { value: "not_validated", children: "N\u00E3o Validado" })] }), _jsxs("select", { className: "border rounded-md px-3 py-2 text-sm", value: selectedEmailFilter || 'all', onChange: e => {
                                    setSelectedEmailFilter(e.target.value);
                                    setPage(1);
                                }, children: [_jsx("option", { value: "all", children: "Todos Emails" }), _jsx("option", { value: "email_sent", children: "Email Enviado" }), _jsx("option", { value: "email_not_sent", children: "Email N\u00E3o Enviado" })] })] })] }), _jsx(Card, { children: orders.length === 0 ? (_jsx("div", { className: "p-8 text-center text-gray-500", children: "Nenhum pedido encontrado" })) : (_jsxs(_Fragment, { children: [_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-8", children: "\u00A0" }), _jsx(TableHead, { children: "C\u00F3digo" }), _jsx(TableHead, { children: "Cliente" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Datas" }), _jsx(TableHead, { children: "A\u00E7\u00F5es" })] }) }), _jsx(TableBody, { children: orders.map(order => (_jsxs(React.Fragment, { children: [_jsxs(TableRow, { className: "hover:bg-gray-50", children: [_jsx(TableCell, { className: "w-8", children: _jsx("button", { onClick: () => toggleRow(order.id), className: "p-1 hover:bg-gray-100 rounded", children: expandedRows[order.id] ? (_jsx(ChevronUp, { className: "w-4 h-4" })) : (_jsx(ChevronDown, { className: "w-4 h-4" })) }) }), _jsx(TableCell, { children: _jsx("span", { className: "text-indigo-600", children: order.tracking_code }) }), _jsxs(TableCell, { children: [_jsx("div", { className: "font-medium", children: order.customer_name }), _jsx("div", { className: "text-sm text-gray-500 truncate max-w-[200px]", children: order.customer_email })] }), _jsx(TableCell, { children: _jsxs("div", { className: "space-y-1", children: [_jsx("span", { className: `px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${getStatusColor(order.status)}`, children: getStatusText(order.status) }), order.payment_status ? (_jsxs("span", { className: "block text-xs text-gray-500", children: ["Pagamento: ", order.payment_status === 'paid' ? 'Confirmado' : order.payment_status] })) : null, _jsxs("div", { className: "flex gap-1 mt-1", children: [order.has_shipping_address === true ? (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800", children: "\uD83D\uDCCD Endere\u00E7o OK" })) : order.has_shipping_address === false ? (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800", children: "\uD83D\uDCCD Sem Endere\u00E7o" })) : (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800", children: "\uD83D\uDCCD N\u00E3o Validado" })), order.email_sent ? (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800", children: "\uD83D\uDCE7 Email Enviado" })) : (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800", children: "\uD83D\uDCE7 Email Pendente" }))] })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "text-sm space-y-1", children: [_jsxs("div", { children: ["Criado em ", format(new Date(order.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })] }), _jsxs("div", { children: ["Atualizado em ", format(new Date(order.updated_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })] })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", leftIcon: _jsx(Eye, { className: "w-4 h-4" }), onClick: () => {
                                                                        // Usar navigate em vez de window.open para manter o contexto da aplicação
                                                                        navigate(`/tracking/${order.tracking_code}`);
                                                                    }, children: "Ver" }), _jsx(Button, { variant: "outline", size: "sm", leftIcon: _jsx(Mail, { className: "w-4 h-4" }), children: "Reenviar" })] }) })] }), expandedRows[order.id] && (_jsxs(TableRow, { className: "bg-gray-50", children: [" ", _jsxs(TableCell, { colSpan: 6, children: [" ", _jsxs("div", { className: "p-4 border-t border-gray-200", children: [" ", _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { className: "p-3 bg-white rounded shadow", children: [_jsx("h5", { className: "font-semibold mb-2 text-gray-700", children: "Detalhes do Cliente" }), _jsxs("dl", { className: "space-y-1", children: [_jsxs("div", { children: [_jsx("dt", { className: "inline font-medium text-gray-500", children: "Nome: " }), _jsx("dd", { className: "inline text-gray-800", children: order.customer_name })] }), _jsxs("div", { children: [_jsx("dt", { className: "inline font-medium text-gray-500", children: "Email: " }), _jsx("dd", { className: "inline text-gray-800", children: order.customer_email })] })] })] }), _jsxs("div", { className: "p-3 bg-white rounded shadow", children: [_jsx("h5", { className: "font-semibold mb-2 text-gray-700", children: "Detalhes do Pagamento" }), _jsxs("dl", { className: "space-y-1", children: [_jsxs("div", { children: [_jsx("dt", { className: "inline font-medium text-gray-500", children: "Valor: " }), _jsx("dd", { className: "inline text-gray-800", children: order.amount != null ? formatCurrency(order.amount) : '—' })] }), _jsxs("div", { children: [_jsx("dt", { className: "inline font-medium text-gray-500", children: "Status: " }), _jsx("dd", { className: "inline text-gray-800", children: order.payment_status ? (order.payment_status === 'paid' ? 'Confirmado' : order.payment_status) : '—' })] }), _jsxs("div", { children: [_jsx("dt", { className: "inline font-medium text-gray-500", children: "ID da Transa\u00E7\u00E3o: " }), _jsx("dd", { className: "inline text-gray-800", children: order.payment_id ?? '—' })] }), _jsxs("div", { children: [_jsx("dt", { className: "inline font-medium text-gray-500", children: "Endere\u00E7o: " }), _jsx("dd", { className: "inline", children: order.has_shipping_address ? (_jsx("span", { className: "text-green-600 font-medium", children: "\u2705 Possui endere\u00E7o" })) : (_jsx("span", { className: "text-red-600 font-medium", children: "\u274C Sem endere\u00E7o" })) })] }), _jsxs("div", { children: [_jsx("dt", { className: "inline font-medium text-gray-500", children: "Email: " }), _jsx("dd", { className: "inline", children: order.email_sent ? (_jsxs("span", { className: "text-blue-600 font-medium", children: ["\u2705 Enviado ", order.email_sent_at ? format(new Date(order.email_sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ''] })) : (_jsx("span", { className: "text-yellow-600 font-medium", children: "\u23F3 Pendente" })) })] })] })] }), _jsxs("div", { className: "p-3 bg-white rounded shadow", children: [_jsx("h5", { className: "font-semibold mb-2 text-gray-700", children: "Fluxo de Status" }), _jsx("p", { className: "text-gray-600", children: "Hist\u00F3rico de status do pedido aparecer\u00E1 aqui." }), _jsx("p", { className: "mt-1 text-xs text-gray-400", children: "(Veja o hist\u00F3rico completo na p\u00E1gina de detalhes do pedido)" })] })] })] })] })] }))] }, order.id))) })] }), _jsxs("footer", { className: "flex items-center justify-between px-4 py-3 border-t", children: [_jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [isFetching && _jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Exibindo ", (page - 1) * pageSize + 1, "\u2013", Math.min(page * pageSize, ordersData?.count || 0), " de ", ordersData?.count || 0] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1 || isLoading, children: "Anterior" }), _jsxs("span", { className: "text-sm", children: ["P\u00E1gina ", page, " de ", totalPages] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page === totalPages || isLoading, children: "Pr\u00F3xima" })] })] })] })) }), _jsx(NewOrderModal, { isOpen: showNewOrderModal, onClose: () => setShowNewOrderModal(false), onSuccess: () => {
                    // Atualizar lista de pedidos
                    queryClient.invalidateQueries({ queryKey: ['orders'] });
                    setShowNewOrderModal(false);
                } })] }));
}
