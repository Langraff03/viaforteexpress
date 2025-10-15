import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { AlertCircle, Search, ChevronLeft, ChevronRight, Package, FileText } from 'lucide-react';
import { Card, CardContent, Input, Button } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { generateInvoiceToken } from '../utils/tokenUtils';
export default function GatewayOrders() {
    const { gatewayId } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState(null);
    const ordersPerPage = 10;
    useEffect(() => {
        // Timeout para garantir que o loading não fique preso
        const loadingTimeout = setTimeout(() => {
            if (loading) {
                console.log('Timeout de carregamento atingido, resetando estado...');
                setLoading(false);
                setError('Tempo limite de carregamento excedido. Tente novamente.');
            }
        }, 30000); // Aumentado para 30 segundos de timeout
        // Função para verificar se o cache está válido
        const isCacheValid = (cacheData) => {
            if (!cacheData)
                return false;
            // Verificar se o cache tem menos de 5 minutos (300000 ms)
            const cacheAge = Date.now() - cacheData.timestamp;
            return cacheAge < 300000;
        };
        // Função para salvar dados no cache
        const saveToCache = (data, gatewayId, statusFilter) => {
            const cacheKey = `orders_cache_${gatewayId}_${statusFilter || 'all'}`;
            const cacheData = {
                data,
                timestamp: Date.now(),
                gatewayId,
                statusFilter
            };
            try {
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
                console.log('Dados salvos no cache local');
            }
            catch (err) {
                console.warn('Não foi possível salvar no cache:', err);
            }
        };
        // Função para carregar dados do cache
        const loadFromCache = (gatewayId, statusFilter) => {
            const cacheKey = `orders_cache_${gatewayId}_${statusFilter || 'all'}`;
            try {
                const cachedData = localStorage.getItem(cacheKey);
                if (!cachedData)
                    return null;
                const parsedCache = JSON.parse(cachedData);
                // Verificar se o cache é válido e corresponde aos parâmetros atuais
                if (isCacheValid(parsedCache) &&
                    parsedCache.gatewayId === gatewayId &&
                    parsedCache.statusFilter === statusFilter) {
                    console.log('Usando dados do cache local');
                    return parsedCache.data;
                }
                return null;
            }
            catch (err) {
                console.warn('Erro ao carregar do cache:', err);
                return null;
            }
        };
        async function fetchOrders() {
            if (!gatewayId) {
                console.error('Gateway ID não encontrado no contexto de autenticação');
                setError('Nenhum gateway associado a este usuário');
                setLoading(false);
                return;
            }
            // Verificar se temos dados em cache
            const cachedData = loadFromCache(gatewayId, statusFilter);
            if (cachedData) {
                setOrders(cachedData);
                setLoading(false);
                return;
            }
            try {
                console.log('Buscando pedidos para gateway_id:', gatewayId);
                console.log('Filtro de status:', statusFilter || 'nenhum');
                // Implementação de retry manual
                let attempts = 0;
                const maxAttempts = 3;
                let success = false;
                let data = null;
                while (attempts < maxAttempts && !success) {
                    try {
                        attempts++;
                        console.log(`Tentativa ${attempts}/${maxAttempts} de buscar pedidos`);
                        // Verificar se o gatewayId é válido (não vazio e no formato correto)
                        if (!gatewayId || typeof gatewayId !== 'string' || gatewayId.trim() === '') {
                            throw new Error('Gateway ID inválido: ' + gatewayId);
                        }
                        // Usar supabase para garantir acesso aos dados
                        let query = supabase
                            .from('orders')
                            .select('id, status, customer_name, created_at, payment_status, payment_id, tracking_code, customer_email')
                            .eq('gateway_id', gatewayId)
                            .order('created_at', { ascending: false });
                        if (statusFilter) {
                            query = query.eq('status', statusFilter);
                        }
                        // Log da consulta para depuração
                        console.log('Consulta SQL gerada:', JSON.stringify({
                            table: 'orders',
                            select: 'id, status, customer_name, created_at, payment_status, payment_id, tracking_code, customer_email',
                            filters: {
                                gateway_id: gatewayId,
                                status: statusFilter || 'todos'
                            }
                        }));
                        // Definir um timeout maior para a consulta
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Timeout excedido')), 25000);
                        });
                        // Executar a consulta com timeout
                        const result = await Promise.race([
                            query,
                            timeoutPromise
                        ]);
                        if (result.error) {
                            console.error('Erro retornado pelo Supabase:', result.error);
                            throw result.error;
                        }
                        data = result.data;
                        success = true;
                    }
                    catch (err) {
                        console.error(`Erro na tentativa ${attempts}:`, err.message);
                        console.error('Stack trace:', err.stack);
                        // Verificar se deve tentar novamente
                        const shouldRetry = err.message.includes('timeout') ||
                            err.message.includes('network') ||
                            err.message.includes('connection');
                        if (!shouldRetry || attempts >= maxAttempts) {
                            throw err;
                        }
                        // Esperar antes de tentar novamente (backoff exponencial)
                        const delay = Math.pow(2, attempts) * 1000;
                        console.log(`Aguardando ${delay}ms antes da próxima tentativa...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
                // Verificar se há dados e registrar para depuração
                console.log('Dados retornados:', data);
                console.log(`Encontrados ${data?.length || 0} pedidos`);
                // Salvar no cache local
                if (data) {
                    saveToCache(data, gatewayId, statusFilter);
                }
                setOrders(data || []);
                setLoading(false);
                setLoading(false);
            }
            catch (err) {
                console.error('Erro ao buscar pedidos após todas as tentativas:', err);
                setError('Erro ao carregar pedidos. Por favor, tente novamente.');
                setLoading(false);
            }
        }
        fetchOrders();
        // Limpar o timeout quando o componente for desmontado
        return () => clearTimeout(loadingTimeout);
    }, [gatewayId, statusFilter]); // Removido 'loading' das dependências para evitar loop
    // Filtrar pedidos com base no termo de pesquisa - com verificação de valores nulos
    const filteredOrders = orders.filter(order => {
        const customerName = order.customer_name?.toLowerCase() || '';
        const customerEmail = order.customer_email?.toLowerCase() || '';
        const orderId = order.id?.toLowerCase() || '';
        const trackingCode = order.tracking_code?.toLowerCase() || '';
        const searchTermLower = searchTerm.toLowerCase();
        return customerName.includes(searchTermLower) ||
            customerEmail.includes(searchTermLower) ||
            orderId.includes(searchTermLower) ||
            trackingCode.includes(searchTermLower);
    });
    // Paginação
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    // Formatar data
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    // Obter classe de cor com base no status - com verificação de valores nulos
    const getStatusClass = (status) => {
        if (!status)
            return 'bg-gray-100 text-gray-800';
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'shipped':
                return 'bg-indigo-100 text-indigo-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'paid':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    // Obter classe de cor com base no status de pagamento
    const getPaymentStatusClass = (status) => {
        if (!status)
            return 'bg-gray-100 text-gray-800';
        switch (status.toLowerCase()) {
            case 'paid':
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'pending':
            case 'waiting_payment':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "flex flex-col justify-center items-center h-64", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4" }), _jsx("p", { className: "text-indigo-600", children: "Carregando pedidos..." })] }));
    }
    if (error) {
        return (_jsxs(_Fragment, { children: [_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4", children: _jsxs("div", { className: "flex", children: [_jsx(AlertCircle, { className: "w-5 h-5 mr-2" }), _jsx("span", { children: error })] }) }), _jsx("button", { onClick: () => {
                        setLoading(true);
                        setError(null);
                    }, className: "px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors", children: "Tentar novamente" })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-lg shadow-md p-6 text-white", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Lista de Pedidos" }), _jsx("p", { className: "text-indigo-100 mt-1", children: "Visualize e gerencie todos os pedidos processados por este gateway." }), _jsxs("div", { className: "mt-4 bg-white/10 rounded-lg p-2 text-sm inline-flex items-center", children: [_jsx("span", { className: "font-medium mr-2", children: "Dica:" }), " Use os bot\u00F5es de rastreio e nota fiscal para visualizar detalhes completos do pedido"] })] }), _jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-100 p-4", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsx(Input, { placeholder: "Pesquisar por nome, email, ID ou c\u00F3digo de rastreio", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full", leftIcon: _jsx(Search, { className: "w-5 h-5 text-gray-400" }) }) }), _jsx("div", { className: "flex gap-2", children: _jsxs("select", { className: "px-4 py-2 border border-gray-300 rounded-md bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-colors", value: statusFilter || '', onChange: (e) => setStatusFilter(e.target.value || null), children: [_jsx("option", { value: "", children: "Todos os status" }), _jsx("option", { value: "pending", children: "Pendente" }), _jsx("option", { value: "processing", children: "Em processamento" }), _jsx("option", { value: "shipped", children: "Enviado" }), _jsx("option", { value: "delivered", children: "Entregue" })] }) })] }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: currentOrders.length === 0 ? (_jsx("div", { className: "p-6 text-center text-gray-500", children: "Nenhum pedido encontrado." })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "ID" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Cliente" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Pagamento" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "C\u00F3digo de Rastreio" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Data" }), _jsx("th", { className: "px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: currentOrders.map((order) => (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900", children: [order.id.substring(0, 8), "..."] }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: [_jsx("div", { children: order.customer_name }), _jsx("div", { className: "text-xs text-gray-400", children: order.customer_email })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`, children: order.status }) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("span", { className: `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusClass(order.payment_status)}`, children: order.payment_status || 'N/A' }), order.payment_id && (_jsxs("div", { className: "text-xs text-gray-400 mt-1", children: ["ID: ", order.payment_id.substring(0, 8), "..."] }))] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Package, { className: "w-4 h-4 text-indigo-500" }), _jsx("span", { className: "text-indigo-600 font-medium", children: order.tracking_code })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: formatDate(order.created_at) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-center", children: _jsxs("div", { className: "flex justify-center space-x-2", children: [_jsxs(Button, { size: "sm", variant: "outline", className: "flex items-center space-x-1 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100", onClick: () => window.open(`/tracking/${order.tracking_code}`, '_blank'), title: "Visualizar rastreio", children: [_jsx(Package, { className: "w-4 h-4" }), _jsx("span", { children: "Rastreio" })] }), _jsxs(Button, { size: "sm", variant: "outline", className: "flex items-center space-x-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100", onClick: () => {
                                                                const invoiceToken = generateInvoiceToken(order.id, order.tracking_code);
                                                                window.open(`/invoice/${invoiceToken}`, '_blank');
                                                            }, title: "Visualizar nota fiscal", children: [_jsx(FileText, { className: "w-4 h-4" }), _jsx("span", { children: "Nota Fiscal" })] })] }) })] }, order.id))) })] }) })) }) }), filteredOrders.length > 0 && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "text-sm text-gray-500", children: ["Mostrando ", indexOfFirstOrder + 1, " a ", Math.min(indexOfLastOrder, filteredOrders.length), " de ", filteredOrders.length, " pedidos"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: () => setCurrentPage(currentPage - 1), disabled: currentPage === 1, className: "px-3 py-1", variant: "outline", children: _jsx(ChevronLeft, { className: "w-5 h-5" }) }), _jsx(Button, { onClick: () => setCurrentPage(currentPage + 1), disabled: currentPage === totalPages, className: "px-3 py-1", variant: "outline", children: _jsx(ChevronRight, { className: "w-5 h-5" }) })] })] }))] }));
}
