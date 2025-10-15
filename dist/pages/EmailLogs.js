import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, RefreshCw, Mail, AlertCircle, CheckCircle, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Alert from '../components/ui/Alert';
const EmailLogs = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isRetrying, setIsRetrying] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const { data: emailLogs = [], isLoading } = useQuery({
        queryKey: ['offerEmailLogs'],
        queryFn: () => api.getOfferEmailLogs()
    });
    useEffect(() => {
        const unsubscribe = api.subscribeToOfferEmailLogs(() => {
            queryClient.invalidateQueries({ queryKey: ['offerEmailLogs'] });
        });
        return () => unsubscribe();
    }, [queryClient]);
    const filteredLogs = emailLogs.filter(log => {
        const matchesSearch = log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.lead_id && log.lead_id.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    const getStatusColor = (status) => {
        const colors = {
            sent: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            failed: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };
    const getStatusIcon = (status) => {
        return status === 'sent' ? (_jsx(CheckCircle, { className: "w-4 h-4 mr-1.5 text-emerald-500" })) : (_jsx(AlertCircle, { className: "w-4 h-4 mr-1.5 text-red-500" }));
    };
    const getStatusText = (status) => {
        return status === 'sent' ? 'Enviado' : 'Falhou';
    };
    const getOriginText = (origin) => {
        switch (origin) {
            case 'manual_send':
                return 'Envio Manual';
            case 'lead_processing':
                return 'Processamento de Lead';
            default:
                return origin;
        }
    };
    const handleRetryFailed = () => {
        setIsRetrying(true);
        setTimeout(() => {
            setIsRetrying(false);
        }, 2000);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-wrap justify-between items-center bg-gradient-to-r from-indigo-500 to-indigo-600 p-8 rounded-xl shadow-lg mb-8", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-white flex items-center", children: [_jsx(Mail, { className: "w-8 h-8 mr-3 text-white" }), "Logs de Email"] }), _jsx("p", { className: "mt-3 text-lg text-indigo-100", children: "Acompanhe todas as notifica\u00E7\u00F5es enviadas aos clientes" })] }), _jsx(Button, { variant: "primary", leftIcon: _jsx(RefreshCw, { className: "h-5 w-5" }), isLoading: isRetrying, onClick: handleRetryFailed, className: "bg-white text-indigo-600 hover:bg-indigo-50 shadow-md transition-all duration-200 font-semibold px-6 py-3", children: "Reenviar Emails com Falha" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-xl shadow-md mb-8", children: [_jsx("div", { className: "md:col-span-2", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Search, { className: "h-5 w-5 text-gray-400" }) }), _jsx("input", { type: "text", className: "block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base transition-all duration-200", placeholder: "Buscar logs de email...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] }) }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Filter, { className: "h-5 w-5 text-gray-400" }) }), _jsxs("select", { value: selectedStatus, onChange: (e) => setSelectedStatus(e.target.value), className: "block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base transition-all duration-200 appearance-none cursor-pointer", children: [_jsx("option", { value: "all", children: "Todos os Status" }), _jsx("option", { value: "sent", children: "Enviados" }), _jsx("option", { value: "failed", children: "Falhas" })] })] }), _jsxs("div", { className: "relative flex-1", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Calendar, { className: "h-5 w-5 text-gray-400" }) }), _jsxs("select", { value: selectedStatus, onChange: (e) => setSelectedStatus(e.target.value), className: "block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base transition-all duration-200 appearance-none cursor-pointer", children: [_jsx("option", { value: "all", children: "Todos os Status" }), _jsx("option", { value: "sent", children: "Enviados" }), _jsx("option", { value: "failed", children: "Falhas" })] })] })] })] }), filteredLogs.some(log => log.status === 'failed') && (_jsx(Alert, { variant: "warning", className: "mb-8 shadow-md", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 mr-2" }), _jsx("span", { children: "Existem emails que falharam no envio. Use o bot\u00E3o \"Reenviar Emails com Falha\"." })] }) })), _jsxs(Card, { className: "shadow-xl rounded-xl overflow-hidden border border-gray-100", children: [_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { className: "bg-gray-50 border-b border-gray-200", children: [_jsx(TableHead, { children: "ID do Lead" }), _jsx(TableHead, { children: "Origem" }), _jsx(TableHead, { children: "Destinat\u00E1rio" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Data de Envio" }), _jsx(TableHead, { children: "A\u00E7\u00F5es" })] }) }), _jsx(TableBody, { children: paginatedLogs.map((log) => (_jsxs(TableRow, { className: "hover:bg-gray-50 transition-colors", children: [_jsx(TableCell, { children: _jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "w-5 h-5 mr-2 text-indigo-500" }), _jsx("span", { className: "font-medium text-indigo-600 tracking-wider", children: log.lead_id || 'N/A' })] }) }), _jsx(TableCell, { children: getOriginText(log.origin) }), _jsx(TableCell, { children: log.email }), _jsx(TableCell, { children: _jsxs("span", { className: `inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(log.status)}`, children: [getStatusIcon(log.status), getStatusText(log.status)] }) }), _jsx(TableCell, { children: format(new Date(log.sent_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) }), _jsx(TableCell, { children: _jsx("span", { className: "text-gray-400", children: "-" }) })] }, log.id))) })] }), totalPages > 1 && (_jsxs("div", { className: "flex flex-wrap items-center justify-between px-6 py-4 bg-white border-t border-gray-200", children: [_jsxs("div", { className: "text-sm text-gray-500 mb-2 md:mb-0", children: ["Mostrando ", startIndex + 1, " a ", Math.min(startIndex + itemsPerPage, filteredLogs.length), " de ", filteredLogs.length, " registros"] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setCurrentPage(p => Math.max(1, p - 1)), disabled: currentPage === 1, children: [_jsx(ChevronLeft, { className: "w-4 h-4" }), "Anterior"] }), currentPage > 2 && (_jsx("button", { className: "px-3 py-1 rounded text-sm hover:bg-gray-100", onClick: () => setCurrentPage(1), children: "1" })), currentPage > 3 && (_jsx("span", { className: "px-2 text-gray-400", children: "..." })), Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => page === currentPage ||
                                        page === currentPage - 1 ||
                                        page === currentPage + 1)
                                        .map(page => (_jsx("button", { onClick: () => setCurrentPage(page), className: `px-3 py-1 rounded text-sm font-semibold ${currentPage === page
                                            ? 'bg-indigo-600 text-white'
                                            : 'hover:bg-gray-100'}`, children: page }, page))), currentPage < totalPages - 2 && (_jsx("span", { className: "px-2 text-gray-400", children: "..." })), currentPage < totalPages - 1 && (_jsx("button", { className: "px-3 py-1 rounded text-sm hover:bg-gray-100", onClick: () => setCurrentPage(totalPages), children: totalPages })), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setCurrentPage(p => Math.min(totalPages, p + 1)), disabled: currentPage === totalPages, children: ["Pr\u00F3xima", _jsx(ChevronRight, { className: "w-4 h-4" })] })] })] }))] })] }));
};
export default EmailLogs;
