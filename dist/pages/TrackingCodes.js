import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package, ExternalLink, Search } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { Card } from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Loader2 } from 'lucide-react';
const TrackingCodes = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        fetchOrders();
    }, []);
    const filteredOrders = orders.filter((order) => {
        const searchLower = searchTerm.toLowerCase();
        return (order.tracking_code.toLowerCase().includes(searchLower) ||
            order.customer_name.toLowerCase().includes(searchLower) ||
            order.customer_email.toLowerCase().includes(searchLower));
    });
    const fetchOrders = async () => {
        try {
            setLoading(true);
            console.log('Buscando pedidos usando supabase...');
            // Usar supabase para ignorar as políticas RLS
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Erro ao buscar pedidos:', error);
                throw error;
            }
            console.log(`Encontrados ${data?.length || 0} pedidos`);
            setOrders(data || []);
        }
        catch (err) {
            console.error('Erro ao carregar pedidos:', err);
            setError(err.message || 'Erro ao carregar pedidos');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-white p-6 rounded-lg shadow-sm mb-6", children: _jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-gray-900 flex items-center", children: [_jsx(Package, { className: "w-8 h-8 mr-3" }), "C\u00F3digos de Rastreio"] }), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Acompanhe todos os c\u00F3digos de rastreio gerados automaticamente quando um pagamento \u00E9 confirmado" })] }) }), _jsx("div", { className: "bg-white p-4 rounded-lg shadow-sm mb-6", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Search, { className: "h-5 w-5 text-gray-400" }) }), _jsx("input", { type: "text", className: "block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm", placeholder: "Buscar por c\u00F3digo, nome ou email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] }) }), _jsx(Card, { children: loading ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx(Loader2, { className: "w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Carregando pedidos..." })] })) : error ? (_jsx(Alert, { variant: "error", className: "m-4", children: error })) : orders.length === 0 ? (_jsxs("div", { className: "p-12 text-center", children: [_jsx(Package, { className: "w-16 h-16 text-gray-400 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 text-lg", children: "Nenhum pedido encontrado" })] })) : (_jsx("div", { className: "w-full overflow-x-auto", children: _jsxs(Table, { className: "min-w-full", children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "C\u00F3digo" }), _jsx(TableHead, { children: "Cliente" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Data" }), _jsx(TableHead, { children: "A\u00E7\u00F5es" })] }) }), _jsx(TableBody, { children: filteredOrders.map((order) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsxs("div", { className: "flex items-center", children: [_jsx(Package, { className: "w-5 h-5 mr-2 text-indigo-500" }), _jsx("span", { className: "font-medium", children: order.tracking_code })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium", children: order.customer_name }), _jsx("span", { className: "text-sm text-gray-500", children: order.customer_email })] }) }), _jsx(TableCell, { children: order.status }), _jsx(TableCell, { children: format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) }), _jsx(TableCell, { children: _jsx("div", { className: "flex space-x-2", children: _jsx(Button, { variant: "outline", size: "sm", leftIcon: _jsx(ExternalLink, { className: "w-4 h-4" }), onClick: () => window.open(`/tracking/${order.tracking_code}`, '_blank'), children: "Ver Rastreio" }) }) })] }, order.id))) })] }) })) })] }));
};
export default TrackingCodes;
