import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
// ✅ Removido import vulnerável - usando apenas supabase (ANON_KEY) + RLS
import { ShoppingBag, Clock, CheckCircle, DollarSign, RefreshCw, Search, Eye, Plus, AlertCircle, LogOut, ChevronDown, Package, TrendingUp, Calendar, Hash, BarChart3, PieChart, LineChart, Activity, Download, MoreVertical, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, Button, Input } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { NewOrderModal } from '../components/ui/NewOrderModal';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
// Paleta de cores moderna e acessível
const COLORS = {
    primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e'
    },
    success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d'
    },
    warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f'
    },
    error: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d'
    },
    gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827'
    },
    gradient: {
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        error: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        chart: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7']
    }
};
// Configurações de animação
const ANIMATION_CONFIG = {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    stagger: 100
};
// Componente de Loading Skeleton
const SkeletonLoader = ({ className }) => (_jsx("div", { className: `animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded-md ${className}`, style: {
        animation: 'shimmer 1.5s infinite linear',
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
    } }));
// Componente do Card de Estatística Melhorado
const StatCard = ({ title, value, icon: Icon, color = 'primary', loading = false, trend, subtitle }) => {
    const colorConfig = {
        primary: {
            bg: 'from-blue-50 to-indigo-50',
            iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
            textColor: 'text-blue-600',
            accentColor: 'text-blue-500'
        },
        success: {
            bg: 'from-green-50 to-emerald-50',
            iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
            textColor: 'text-green-600',
            accentColor: 'text-green-500'
        },
        warning: {
            bg: 'from-yellow-50 to-orange-50',
            iconBg: 'bg-gradient-to-br from-yellow-500 to-orange-600',
            textColor: 'text-yellow-600',
            accentColor: 'text-yellow-500'
        },
        error: {
            bg: 'from-red-50 to-rose-50',
            iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
            textColor: 'text-red-600',
            accentColor: 'text-red-500'
        }
    };
    const config = colorConfig[color];
    return (_jsxs(Card, { className: "group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white hover:scale-[1.02] relative", children: [_jsx("div", { className: `absolute inset-0 bg-gradient-to-br ${config.bg} opacity-60` }), _jsx(CardContent, { className: "p-6 relative z-10", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("p", { className: "text-sm font-semibold text-gray-600 uppercase tracking-wider", children: title }), trend && (_jsxs("span", { className: `flex items-center text-xs px-2 py-1 rounded-full ${trend.direction === 'up'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'}`, children: [trend.direction === 'up' ? _jsx(ArrowUpRight, { className: "w-3 h-3 mr-1" }) : _jsx(ArrowDownRight, { className: "w-3 h-3 mr-1" }), Math.abs(trend.value), "%"] }))] }), _jsx("div", { className: "mb-2", children: loading ? (_jsx(SkeletonLoader, { className: "h-8 w-32" })) : (_jsx("h3", { className: `text-3xl font-bold ${config.textColor} transition-colors duration-200`, children: value })) }), subtitle && (_jsx("p", { className: "text-sm text-gray-500 font-medium", children: subtitle }))] }), _jsx("div", { className: `p-4 rounded-2xl ${config.iconBg} shadow-lg transform transition-transform duration-200 group-hover:scale-110`, children: _jsx(Icon, { className: "w-6 h-6 text-white" }) })] }) })] }));
};
// Componente de Tooltip Customizado
const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
        return (_jsxs("div", { className: "bg-white p-4 border border-gray-200 rounded-lg shadow-lg", children: [_jsx("p", { className: "font-semibold text-gray-800 mb-2", children: label }), payload.map((entry, index) => {
                    let displayValue = entry.value;
                    let displayLabel = entry.name;
                    if (formatter) {
                        const formatterResult = formatter(entry.value, entry.name);
                        if (Array.isArray(formatterResult)) {
                            displayValue = formatterResult[0];
                            displayLabel = formatterResult[1];
                        }
                        else {
                            displayValue = formatterResult;
                        }
                    }
                    return (_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: entry.color } }), _jsxs("span", { className: "text-sm text-gray-600", children: [displayLabel, ":"] }), _jsx("span", { className: "text-sm font-semibold text-gray-800", children: displayValue })] }, index));
                })] }));
    }
    return null;
};
// Componente da Tabela de Pedidos Melhorado
const OrdersTable = ({ orders, loading, exportToCSV, handleViewOrder, handleOrderMenu, showOrderMenu, handleNavigateToOrder, handleCopyTrackingCode, navigate }) => {
    const getStatusConfig = (status) => {
        const configs = {
            completed: {
                label: 'Concluído',
                className: 'bg-green-100 text-green-800 border-green-200',
                icon: CheckCircle
            },
            pending: {
                label: 'Pendente',
                className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                icon: Clock
            },
            failed: {
                label: 'Falhou',
                className: 'bg-red-100 text-red-800 border-red-200',
                icon: AlertCircle
            }
        };
        return configs[status] || configs.pending;
    };
    return (_jsx(Card, { className: "border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300", children: _jsxs(CardContent, { className: "p-0", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-blue-100 rounded-lg", children: _jsx(ShoppingBag, { className: "w-5 h-5 text-blue-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold text-gray-900", children: "Pedidos Recentes" }), _jsx("p", { className: "text-sm text-gray-500", children: "\u00DAltimos pedidos do per\u00EDodo selecionado" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full", children: [_jsx(Activity, { className: "w-4 h-4" }), _jsxs("span", { children: [orders.length, " pedidos"] })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportToCSV(orders, 'pedidos-recentes', 'orders'), disabled: orders.length === 0, title: "Exportar pedidos para CSV", children: [_jsx(Download, { className: "w-4 h-4 mr-1" }), "Exportar"] })] })] }) }), _jsx("div", { className: "p-6", children: loading ? (_jsx("div", { className: "space-y-4", children: [...Array(5)].map((_, i) => (_jsxs("div", { className: "flex items-center gap-4 p-4 bg-gray-50 rounded-lg animate-pulse", children: [_jsx(SkeletonLoader, { className: "w-12 h-12 rounded-full" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx(SkeletonLoader, { className: "h-4 w-48" }), _jsx(SkeletonLoader, { className: "h-3 w-32" })] }), _jsx(SkeletonLoader, { className: "h-6 w-20" }), _jsx(SkeletonLoader, { className: "h-6 w-24" })] }, i))) })) : orders.length === 0 ? (_jsxs("div", { className: "text-center py-16", children: [_jsx("div", { className: "w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center", children: _jsx(ShoppingBag, { className: "w-12 h-12 text-gray-400" }) }), _jsx("h4", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Nenhum pedido encontrado" }), _jsx("p", { className: "text-gray-500 max-w-md mx-auto", children: "N\u00E3o h\u00E1 pedidos para o per\u00EDodo selecionado. Experimente alterar o filtro de data ou criar um novo pedido." })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200", children: [_jsx("th", { className: "text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50", children: "Cliente" }), _jsx("th", { className: "text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50", children: "Valor" }), _jsx("th", { className: "text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50", children: "Status" }), _jsx("th", { className: "text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50", children: "Data" }), _jsx("th", { className: "text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50", children: "C\u00F3digo" }), _jsx("th", { className: "text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { children: orders.map((order, index) => {
                                        const statusConfig = getStatusConfig(order.status);
                                        const StatusIcon = statusConfig.icon;
                                        return (_jsxs("tr", { className: "border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 group", children: [_jsx("td", { className: "py-4 px-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm", children: order.customer_name.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold text-gray-900", children: order.customer_name }), _jsxs("p", { className: "text-sm text-gray-500", children: ["ID: ", order.id.slice(0, 8)] })] })] }) }), _jsx("td", { className: "py-4 px-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(DollarSign, { className: "w-4 h-4 text-green-600" }), _jsx("span", { className: "font-bold text-green-600 text-lg", children: formatCurrency(order.amount / 100) })] }) }), _jsx("td", { className: "py-4 px-4", children: _jsxs("span", { className: `inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.className}`, children: [_jsx(StatusIcon, { className: "w-3 h-3" }), statusConfig.label] }) }), _jsx("td", { className: "py-4 px-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "text-gray-600", children: new Date(order.created_at).toLocaleDateString('pt-BR') })] }) }), _jsx("td", { className: "py-4 px-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Hash, { className: "w-4 h-4 text-gray-400" }), _jsx("span", { className: "font-mono text-sm bg-gray-100 px-2 py-1 rounded border", children: order.tracking_code || 'N/A' })] }) }), _jsx("td", { className: "py-4 px-4", children: _jsxs("div", { className: "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => handleViewOrder(order), title: "Visualizar detalhes do pedido", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsxs("div", { className: "relative", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => handleOrderMenu(order.id), title: "Mais op\u00E7\u00F5es", children: _jsx(MoreVertical, { className: "w-4 h-4" }) }), showOrderMenu === order.id && (_jsxs("div", { className: "absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10", children: [_jsxs("button", { onClick: () => handleNavigateToOrder(order.id), className: "w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2", children: [_jsx(Eye, { className: "w-4 h-4" }), "Ver detalhes"] }), _jsxs("button", { onClick: () => handleCopyTrackingCode(order.tracking_code || ''), className: "w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2", disabled: !order.tracking_code || order.tracking_code === 'N/A', children: [_jsx(Hash, { className: "w-4 h-4" }), "Copiar c\u00F3digo"] }), _jsxs("button", { onClick: () => navigate(`/tracking/${order.tracking_code}`), className: "w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2", disabled: !order.tracking_code || order.tracking_code === 'N/A', children: [_jsx(Package, { className: "w-4 h-4" }), "Rastrear pedido"] })] }))] })] }) })] }, order.id));
                                    }) })] }) })) })] }) }));
};
// Componente da Tabela de Produtos Mais Vendidos
const TopProductsTable = ({ products, loading }) => (_jsx(Card, { className: "border-0 shadow-md", children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h3", { className: "text-xl font-bold text-gray-900", children: "Produtos Mais Vendidos" }), _jsxs("div", { className: "flex items-center text-sm text-gray-500", children: [_jsx(Package, { className: "w-4 h-4 mr-1" }), products.length, " produtos"] })] }), loading ? (_jsxs("div", { className: "flex justify-center items-center py-12", children: [_jsx(RefreshCw, { className: "w-8 h-8 animate-spin text-indigo-500" }), _jsx("span", { className: "ml-3 text-gray-600", children: "Carregando produtos..." })] })) : products.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-gray-500", children: [_jsx(Package, { className: "w-16 h-16 mx-auto mb-4 text-gray-300" }), _jsx("p", { className: "text-lg font-medium", children: "Nenhum produto encontrado" }), _jsx("p", { className: "text-sm mt-1", children: "N\u00E3o h\u00E1 produtos vendidos para o per\u00EDodo selecionado" })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b-2 border-gray-200", children: [_jsx("th", { className: "text-left py-3 px-2 font-semibold text-gray-700", children: "Produto" }), _jsx("th", { className: "text-left py-3 px-2 font-semibold text-gray-700", children: "Categoria" }), _jsx("th", { className: "text-left py-3 px-2 font-semibold text-gray-700", children: "Qtd. Vendida" }), _jsx("th", { className: "text-left py-3 px-2 font-semibold text-gray-700", children: "Receita Total" }), _jsx("th", { className: "text-left py-3 px-2 font-semibold text-gray-700", children: "N\u00BA Pedidos" }), _jsx("th", { className: "text-left py-3 px-2 font-semibold text-gray-700", children: "Ticket M\u00E9dio" }), _jsx("th", { className: "text-left py-3 px-2 font-semibold text-gray-700", children: "Primeira Venda" }), _jsx("th", { className: "text-left py-3 px-2 font-semibold text-gray-700", children: "\u00DAltima Venda" })] }) }), _jsx("tbody", { children: products.map((product, index) => (_jsxs("tr", { className: `border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`, children: [_jsx("td", { className: "py-3 px-2", children: _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "font-medium text-gray-900", children: product.product_name }), product.product_description && (_jsx("span", { className: "text-sm text-gray-500 truncate max-w-xs", children: product.product_description }))] }) }), _jsx("td", { className: "py-3 px-2", children: _jsx("span", { className: `px-2 py-1 rounded-full text-xs ${product.product_category
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-600'}`, children: product.product_category || 'Sem categoria' }) }), _jsx("td", { className: "py-3 px-2 font-semibold text-gray-900", children: product.total_quantity.toLocaleString('pt-BR') }), _jsx("td", { className: "py-3 px-2 font-semibold text-green-600", children: formatCurrency(product.total_revenue / 100) }), _jsx("td", { className: "py-3 px-2 text-gray-600", children: product.order_count.toLocaleString('pt-BR') }), _jsx("td", { className: "py-3 px-2 font-medium text-gray-900", children: formatCurrency(product.avg_price / 100) }), _jsx("td", { className: "py-3 px-2 text-gray-600", children: new Date(product.first_sale).toLocaleDateString('pt-BR') }), _jsx("td", { className: "py-3 px-2 text-gray-600", children: new Date(product.last_sale).toLocaleDateString('pt-BR') })] }, `${product.product_name}-${index}`))) })] }) }))] }) }));
// Componente de Gráfico de Vendas ao Longo do Tempo Melhorado
const SalesChart = ({ data, loading, exportToCSV }) => (_jsx(Card, { className: "border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300", children: _jsxs(CardContent, { className: "p-0", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-blue-100 rounded-lg", children: _jsx(TrendingUp, { className: "w-5 h-5 text-blue-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold text-gray-900", children: "Vendas ao Longo do Tempo" }), _jsx("p", { className: "text-sm text-gray-500", children: "Performance temporal das vendas" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm", children: [_jsx(LineChart, { className: "w-4 h-4" }), _jsxs("span", { children: [data.length, " pontos"] })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportToCSV(data, 'vendas-ao-longo-do-tempo', 'sales'), disabled: data.length === 0, title: "Exportar dados de vendas para CSV", children: [_jsx(Download, { className: "w-4 h-4 mr-1" }), "Exportar"] })] })] }) }), _jsx("div", { className: "p-6", children: loading ? (_jsx("div", { className: "flex justify-center items-center py-16", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center", children: _jsx(RefreshCw, { className: "w-8 h-8 text-white animate-spin" }) }), _jsx("p", { className: "text-gray-600 font-medium", children: "Carregando dados temporais..." }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Analisando tend\u00EAncias" })] }) })) : data.length === 0 ? (_jsxs("div", { className: "text-center py-16", children: [_jsx("div", { className: "w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center", children: _jsx(TrendingUp, { className: "w-12 h-12 text-gray-400" }) }), _jsx("h4", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Nenhum dado encontrado" }), _jsx("p", { className: "text-gray-500 max-w-md mx-auto", children: "N\u00E3o h\u00E1 vendas para o per\u00EDodo selecionado. Experimente alterar o filtro de data para ver mais dados." })] })) : (_jsx("div", { className: "h-96", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(RechartsLineChart, { data: data, margin: { top: 20, right: 30, left: 20, bottom: 60 }, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "salesGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: COLORS.gradient.chart[0], stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: COLORS.gradient.chart[0], stopOpacity: 0.1 })] }), _jsxs("linearGradient", { id: "revenueGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: COLORS.gradient.chart[1], stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: COLORS.gradient.chart[1], stopOpacity: 0.1 })] })] }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: COLORS.gray[300], opacity: 0.6 }), _jsx(XAxis, { dataKey: "date", tick: { fontSize: 12, fill: COLORS.gray[600] }, axisLine: { stroke: COLORS.gray[300] }, tickLine: { stroke: COLORS.gray[300] } }), _jsx(YAxis, { yAxisId: "left", tick: { fontSize: 12, fill: COLORS.gray[600] }, axisLine: { stroke: COLORS.gray[300] }, tickLine: { stroke: COLORS.gray[300] } }), _jsx(YAxis, { yAxisId: "right", orientation: "right", tick: { fontSize: 12, fill: COLORS.gray[600] }, axisLine: { stroke: COLORS.gray[300] }, tickLine: { stroke: COLORS.gray[300] } }), _jsx(Tooltip, { content: _jsx(CustomTooltip, { formatter: (value, name) => {
                                            if (name === 'revenue') {
                                                return [formatCurrency(value / 100), 'Receita'];
                                            }
                                            return [value, name === 'sales' ? 'Vendas' : 'Pedidos'];
                                        } }) }), _jsx(Legend, { wrapperStyle: { paddingTop: '20px' }, iconType: "circle" }), _jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "sales", stroke: COLORS.gradient.chart[0], strokeWidth: 3, dot: { fill: COLORS.gradient.chart[0], strokeWidth: 2, r: 4 }, activeDot: { r: 6, stroke: COLORS.gradient.chart[0], strokeWidth: 2 }, name: "Vendas" }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "revenue", stroke: COLORS.gradient.chart[1], strokeWidth: 3, dot: { fill: COLORS.gradient.chart[1], strokeWidth: 2, r: 4 }, activeDot: { r: 6, stroke: COLORS.gradient.chart[1], strokeWidth: 2 }, name: "Receita" })] }) }) })) })] }) }));
// Componente de Gráfico de Distribuição por Categoria Melhorado
const CategoryChart = ({ data, loading, exportToCSV }) => {
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = (entry) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent } = entry;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (_jsx("text", { x: x, y: y, fill: "white", textAnchor: x > cx ? 'start' : 'end', dominantBaseline: "central", fontSize: "13", fontWeight: "600", className: "drop-shadow-sm", children: `${(percent * 100).toFixed(0)}%` }));
    };
    // Cores melhoradas para o gráfico de pizza
    const chartColors = [
        COLORS.gradient.chart[0],
        COLORS.gradient.chart[1],
        COLORS.gradient.chart[2],
        COLORS.gradient.chart[3],
        COLORS.primary[500],
        COLORS.warning[500],
        COLORS.error[500],
        COLORS.success[600]
    ];
    const enhancedData = data.map((item, index) => ({
        ...item,
        color: chartColors[index % chartColors.length]
    }));
    return (_jsx(Card, { className: "border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300", children: _jsxs(CardContent, { className: "p-0", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-purple-100 rounded-lg", children: _jsx(PieChart, { className: "w-5 h-5 text-purple-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold text-gray-900", children: "Distribui\u00E7\u00E3o por Categoria" }), _jsx("p", { className: "text-sm text-gray-500", children: "An\u00E1lise de receita por categoria" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm", children: [_jsx(Package, { className: "w-4 h-4" }), _jsxs("span", { children: [data.length, " categorias"] })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportToCSV(data, 'distribuicao-por-categoria', 'categories'), disabled: data.length === 0, title: "Exportar dados de categoria para CSV", children: [_jsx(Download, { className: "w-4 h-4 mr-1" }), "Exportar"] })] })] }) }), _jsx("div", { className: "p-6", children: loading ? (_jsx("div", { className: "flex justify-center items-center py-16", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center", children: _jsx(RefreshCw, { className: "w-8 h-8 text-white animate-spin" }) }), _jsx("p", { className: "text-gray-600 font-medium", children: "Carregando distribui\u00E7\u00E3o..." }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Analisando categorias" })] }) })) : data.length === 0 ? (_jsxs("div", { className: "text-center py-16", children: [_jsx("div", { className: "w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center", children: _jsx(PieChart, { className: "w-12 h-12 text-gray-400" }) }), _jsx("h4", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Nenhuma categoria encontrada" }), _jsx("p", { className: "text-gray-500 max-w-md mx-auto", children: "N\u00E3o h\u00E1 produtos categorizados para o per\u00EDodo selecionado. Verifique se h\u00E1 produtos cadastrados." })] })) : (_jsxs("div", { className: "flex flex-col lg:flex-row gap-6", children: [_jsx("div", { className: "flex-1", children: _jsx("div", { className: "h-96", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(RechartsPieChart, { children: [_jsx("defs", { children: enhancedData.map((entry, index) => (_jsxs("linearGradient", { id: `gradient-${index}`, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: entry.color, stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: entry.color, stopOpacity: 0.6 })] }, `gradient-${index}`))) }), _jsx(Pie, { data: enhancedData, cx: "50%", cy: "50%", labelLine: false, label: renderCustomizedLabel, outerRadius: 120, innerRadius: 60, fill: "#8884d8", dataKey: "revenue", stroke: "white", strokeWidth: 2, children: enhancedData.map((entry, index) => (_jsx(Cell, { fill: `url(#gradient-${index})`, className: "hover:opacity-80 transition-opacity duration-200" }, `cell-${index}`))) }), _jsx(Tooltip, { content: _jsx(CustomTooltip, { formatter: (value) => [formatCurrency(value / 100), 'Receita'] }) }), _jsx(Legend, { verticalAlign: "bottom", height: 36, iconType: "circle", wrapperStyle: { paddingTop: '20px' } })] }) }) }) }), _jsx("div", { className: "lg:w-80", children: _jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-4", children: "Resumo das Categorias" }), enhancedData.slice(0, 5).map((category, index) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: category.color } }), _jsx("span", { className: "font-medium text-gray-900", children: category.category })] }), _jsx("span", { className: "text-sm font-semibold text-gray-600", children: formatCurrency(category.revenue / 100) })] }, index))), enhancedData.length > 5 && (_jsxs("div", { className: "text-center py-2 text-sm text-gray-500", children: ["+", enhancedData.length - 5, " outras categorias"] }))] }) })] })) })] }) }));
};
// Componente de Gráfico de Top Produtos Melhorado
const TopProductsChart = ({ data, loading, exportToCSV }) => {
    const chartData = useMemo(() => {
        return data.slice(0, 10).map(product => ({
            name: product.product_name.length > 20
                ? `${product.product_name.substring(0, 20)}...`
                : product.product_name,
            fullName: product.product_name,
            revenue: product.total_revenue,
            quantity: product.total_quantity,
            orders: product.order_count
        }));
    }, [data]);
    return (_jsx(Card, { className: "border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300", children: _jsxs(CardContent, { className: "p-0", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-green-100 rounded-lg", children: _jsx(BarChart3, { className: "w-5 h-5 text-green-600" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold text-gray-900", children: "Top 10 Produtos" }), _jsx("p", { className: "text-sm text-gray-500", children: "Produtos mais vendidos por receita" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-1 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm", children: [_jsx(Package, { className: "w-4 h-4" }), _jsxs("span", { children: [chartData.length, " produtos"] })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => exportToCSV(data, 'top-produtos', 'products'), disabled: data.length === 0, title: "Exportar dados de produtos para CSV", children: [_jsx(Download, { className: "w-4 h-4 mr-1" }), "Exportar"] })] })] }) }), _jsx("div", { className: "p-6", children: loading ? (_jsx("div", { className: "flex justify-center items-center py-16", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center", children: _jsx(RefreshCw, { className: "w-8 h-8 text-white animate-spin" }) }), _jsx("p", { className: "text-gray-600 font-medium", children: "Carregando produtos..." }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Analisando performance" })] }) })) : chartData.length === 0 ? (_jsxs("div", { className: "text-center py-16", children: [_jsx("div", { className: "w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center", children: _jsx(BarChart3, { className: "w-12 h-12 text-gray-400" }) }), _jsx("h4", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Nenhum produto encontrado" }), _jsx("p", { className: "text-gray-500 max-w-md mx-auto", children: "N\u00E3o h\u00E1 produtos vendidos para o per\u00EDodo selecionado. Adicione produtos ao seu cat\u00E1logo." })] })) : (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "h-96", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(RechartsBarChart, { data: chartData, margin: { top: 20, right: 30, left: 20, bottom: 80 }, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "revenueGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: COLORS.gradient.chart[0], stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: COLORS.gradient.chart[0], stopOpacity: 0.2 })] }), _jsxs("linearGradient", { id: "quantityGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: COLORS.gradient.chart[1], stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: COLORS.gradient.chart[1], stopOpacity: 0.2 })] })] }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: COLORS.gray[300], opacity: 0.6 }), _jsx(XAxis, { dataKey: "name", angle: -45, textAnchor: "end", height: 100, tick: { fontSize: 12, fill: COLORS.gray[600] }, axisLine: { stroke: COLORS.gray[300] }, tickLine: { stroke: COLORS.gray[300] } }), _jsx(YAxis, { tick: { fontSize: 12, fill: COLORS.gray[600] }, axisLine: { stroke: COLORS.gray[300] }, tickLine: { stroke: COLORS.gray[300] } }), _jsx(Tooltip, { content: _jsx(CustomTooltip, { formatter: (value, name) => {
                                                        if (name === 'revenue') {
                                                            return [formatCurrency(value / 100), 'Receita'];
                                                        }
                                                        return [value, name === 'quantity' ? 'Quantidade' : 'Pedidos'];
                                                    } }) }), _jsx(Legend, { wrapperStyle: { paddingTop: '20px' }, iconType: "circle" }), _jsx(Bar, { dataKey: "revenue", fill: "url(#revenueGradient)", name: "Receita", radius: [4, 4, 0, 0], className: "hover:opacity-80 transition-opacity duration-200" }), _jsx(Bar, { dataKey: "quantity", fill: "url(#quantityGradient)", name: "Quantidade", radius: [4, 4, 0, 0], className: "hover:opacity-80 transition-opacity duration-200" })] }) }) }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-3", children: "Resumo dos Top 5 Produtos" }), _jsx("div", { className: "space-y-2", children: chartData.slice(0, 5).map((product, index) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm", children: index + 1 }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: product.fullName }), _jsxs("p", { className: "text-sm text-gray-500", children: [product.orders, " pedidos"] })] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-semibold text-gray-900", children: formatCurrency(product.revenue / 100) }), _jsxs("p", { className: "text-sm text-gray-500", children: [product.quantity, " unidades"] })] })] }, index))) })] })] })) })] }) }));
};
// Container dos Gráficos
const ChartsContainer = ({ salesData, salesLoading, categoryData, categoryLoading, topProductsData, topProductsLoading, exportToCSV }) => (_jsxs("div", { className: "space-y-6", children: [_jsx(SalesChart, { data: salesData, loading: salesLoading, exportToCSV: exportToCSV }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(CategoryChart, { data: categoryData, loading: categoryLoading, exportToCSV: exportToCSV }), _jsx(TopProductsChart, { data: topProductsData, loading: topProductsLoading, exportToCSV: exportToCSV })] })] }));
// Componente Principal do Dashboard
// Componente Principal do Dashboard
export default function GatewayDashboard() {
    console.log('🌐 DEBUG [GATEWAY Dashboard] Componente GatewayDashboard foi renderizado!');
    const navigate = useNavigate();
    // Estados
    const [user, setUser] = useState(null);
    const [gatewayId, setGatewayId] = useState(null);
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0
    });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('today');
    const [trackingCode, setTrackingCode] = useState('');
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    // Estados para produtos mais vendidos
    const [activeTab, setActiveTab] = useState('dashboard');
    const [topProducts, setTopProducts] = useState([]);
    const [topProductsLoading, setTopProductsLoading] = useState(true);
    // Estados para gráficos
    const [salesOverTime, setSalesOverTime] = useState([]);
    const [salesOverTimeLoading, setSalesOverTimeLoading] = useState(true);
    const [categoryDistribution, setCategoryDistribution] = useState([]);
    const [categoryDistributionLoading, setCategoryDistributionLoading] = useState(true);
    // Estados para modais e ações
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [showOrderMenu, setShowOrderMenu] = useState(null);
    // Verificar autenticação e carregar dados do usuário
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    console.log('❌ Não há sessão ativa');
                    navigate('/login');
                    return;
                }
                console.log('✅ Sessão encontrada para:', session.user.email);
                // Buscar dados do usuário
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*, gateway:gateways(id, type)')
                    .eq('id', session.user.id)
                    .single();
                if (profileError) {
                    console.error('❌ Erro ao buscar perfil:', profileError);
                    setError('Erro ao carregar dados do usuário');
                    return;
                }
                if (profile.role !== 'gateway_user') {
                    console.log('❌ Usuário não tem permissão para acessar o dashboard');
                    navigate('/unauthorized');
                    return;
                }
                setUser(profile);
                setGatewayId(profile.gateway_id);
                console.log('✅ Usuário carregado:', {
                    email: profile.email,
                    role: profile.role,
                    gatewayId: profile.gateway_id
                });
            }
            catch (err) {
                console.error('❌ Erro na verificação de autenticação:', err);
                setError(err.message);
            }
            finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [navigate]);
    // Função para calcular datas do período
    const getDateRange = useCallback((range) => {
        const now = new Date();
        // Obter valores UTC da data atual
        const nowUTC = {
            year: now.getUTCFullYear(),
            month: now.getUTCMonth(),
            date: now.getUTCDate()
        };
        let startDate;
        let endDate;
        switch (range) {
            case 'today':
                // Início do dia atual em UTC (00:00:00.000 UTC)
                startDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 0, 0, 0, 0));
                // Fim do dia atual em UTC (23:59:59.999 UTC)
                endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
                break;
            case 'week':
                // Últimos 7 dias completos em UTC (hoje + 6 dias anteriores)
                startDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date - 6, 0, 0, 0, 0));
                // Fim do dia atual em UTC
                endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
                break;
            case 'month':
                // Primeiro dia do mês atual em UTC
                startDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, 1, 0, 0, 0, 0));
                // Fim do dia atual em UTC
                endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
                break;
            case 'year':
                // Primeiro dia do ano atual em UTC
                startDate = new Date(Date.UTC(nowUTC.year, 0, 1, 0, 0, 0, 0));
                // Fim do dia atual em UTC
                endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
                break;
            default:
                // Fallback para 'today'
                startDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 0, 0, 0, 0));
                endDate = new Date(Date.UTC(nowUTC.year, nowUTC.month, nowUTC.date, 23, 59, 59, 999));
        }
        const result = {
            start: startDate.toISOString(),
            end: endDate.toISOString()
        };
        // Calcular quantos dias o range abrange
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`📅 [DATE RANGE] ${range} (${daysDiff} days):`, {
            'Local Time': {
                start: startDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                end: endDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            },
            'UTC Time': {
                start: startDate.toUTCString(),
                end: endDate.toUTCString()
            },
            'ISO Strings': {
                start: result.start,
                end: result.end
            }
        });
        return result;
    }, []);
    // Função para buscar estatísticas
    // Função para buscar estatísticas com paginação (baseada no Dashboard.tsx)
    const fetchStats = useCallback(async () => {
        if (!gatewayId)
            return;
        setStatsLoading(true);
        setError(null);
        try {
            console.log('🔄 [GATEWAY STATS] Buscando estatísticas...');
            console.log('📊 Gateway ID:', gatewayId);
            console.log('📅 Período:', timeRange);
            const { start, end } = getDateRange(timeRange);
            console.log('📅 Intervalo de datas:', { start, end });
            // Buscar TODOS os pedidos usando paginação automática (resolver limite de 1000 do Supabase)
            console.log('🔄 [PAGINAÇÃO] Iniciando busca paginada de pedidos...');
            let ordersInDateRange = [];
            let hasMore = true;
            let pageCount = 0;
            const pageSize = 1000; // Tamanho da página para paginação
            while (hasMore && pageCount < 100) { // Limite de segurança de 100 páginas (100k registros max)
                const offset = pageCount * pageSize;
                console.log(`📄 [PÁGINA ${pageCount + 1}] Buscando registros ${offset + 1} a ${offset + pageSize}...`);
                const { data: pageData, error: pageError } = await supabase
                    .from('orders')
                    .select('id, status, payment_status, amount, created_at')
                    .eq('gateway_id', gatewayId)
                    .gte('created_at', start)
                    .lte('created_at', end)
                    .order('created_at', { ascending: true })
                    .range(offset, offset + pageSize - 1);
                if (pageError) {
                    console.error('❌ Erro na paginação:', pageError);
                    throw pageError;
                }
                const pageResults = (pageData || []);
                console.log(`📊 [PÁGINA ${pageCount + 1}] Encontrados ${pageResults.length} registros`);
                if (pageResults.length === 0) {
                    console.log('🏁 [PAGINAÇÃO] Fim dos dados - página vazia');
                    hasMore = false;
                }
                else {
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
            // Calcular estatísticas
            const totalOrders = ordersInDateRange.length;
            const pendingOrders = ordersInDateRange.filter(order => order.status === 'pending' || order.payment_status === 'pending').length;
            const completedOrders = ordersInDateRange.filter(order => order.status === 'completed' || order.payment_status === 'paid').length;
            const totalRevenue = ordersInDateRange.reduce((sum, order) => sum + (order.amount || 0), 0);
            const newStats = {
                totalOrders,
                pendingOrders,
                completedOrders,
                totalRevenue
            };
            setStats(newStats);
            setLastUpdated(new Date());
            console.log('✅ Estatísticas calculadas:', {
                ...newStats,
                totalRevenueFormatted: formatCurrency(totalRevenue / 100)
            });
        }
        catch (err) {
            console.error('❌ Erro ao buscar estatísticas:', err);
            setError(`Erro ao carregar estatísticas: ${err.message}`);
        }
        finally {
            setStatsLoading(false);
        }
    }, [gatewayId, timeRange, getDateRange]);
    // Função para buscar pedidos recentes com paginação
    const fetchRecentOrders = useCallback(async () => {
        if (!gatewayId)
            return;
        setLoading(true);
        try {
            console.log('🔄 [RECENT ORDERS] Buscando pedidos recentes...');
            const { start, end } = getDateRange(timeRange);
            // Para pedidos recentes, vamos buscar apenas os primeiros 100 mais recentes
            // usando a mesma estratégia de paginação do Dashboard
            console.log('🔄 [PAGINAÇÃO RECENTES] Buscando pedidos recentes paginados...');
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('id, customer_name, amount, status, payment_status, created_at, tracking_code')
                .eq('gateway_id', gatewayId)
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at', { ascending: false })
                .range(0, 99); // Buscar os 100 pedidos mais recentes
            if (ordersError) {
                console.error('❌ Erro ao buscar pedidos recentes:', ordersError);
                throw ordersError;
            }
            setOrders(ordersData || []);
            console.log('✅ Pedidos recentes obtidos:', {
                total: ordersData?.length || 0,
                samples: ordersData?.slice(0, 2)
            });
        }
        catch (err) {
            console.error('❌ Erro ao buscar pedidos recentes:', err);
            setError(`Erro ao carregar pedidos: ${err.message}`);
        }
        finally {
            setLoading(false);
        }
    }, [gatewayId, timeRange, getDateRange]);
    // Função para buscar produtos mais vendidos
    const fetchTopProducts = useCallback(async () => {
        if (!gatewayId)
            return;
        setTopProductsLoading(true);
        setError(null);
        try {
            console.log('🔄 [TOP PRODUCTS] Buscando produtos mais vendidos...');
            console.log('📊 Gateway ID:', gatewayId);
            console.log('📅 Período:', timeRange);
            const { start, end } = getDateRange(timeRange);
            console.log('📅 Intervalo de datas:', { start, end });
            // Query SQL para buscar produtos mais vendidos com todas as informações
            const { data: productsData, error: productsError } = await supabase
                .rpc('get_top_products', {
                p_gateway_id: gatewayId,
                p_start_date: start,
                p_end_date: end,
                p_limit: 20
            });
            if (productsError) {
                console.error('❌ Erro ao buscar produtos mais vendidos:', productsError);
                // Fallback: fazer query diretamente se a function não existir
                console.log('🔄 [FALLBACK] Tentando query direta...');
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('order_items')
                    .select(`
            product_name,
            product_category,
            product_description,
            quantity,
            unit_price,
            order_id,
            orders!inner(
              id,
              gateway_id,
              created_at
            )
          `)
                    .eq('orders.gateway_id', gatewayId)
                    .gte('orders.created_at', start)
                    .lte('orders.created_at', end);
                if (fallbackError) {
                    console.error('❌ Erro na query fallback:', fallbackError);
                    throw fallbackError;
                }
                // Processar dados manualmente
                const productMap = new Map();
                (fallbackData || []).forEach((item) => {
                    const key = `${item.product_name}-${item.product_category}`;
                    const existing = productMap.get(key);
                    const orderData = Array.isArray(item.orders) ? item.orders[0] : item.orders;
                    if (existing) {
                        existing.total_quantity += item.quantity;
                        existing.total_revenue += (item.unit_price * item.quantity);
                        existing.order_ids.add(item.order_id);
                        existing.prices.push(item.unit_price);
                        existing.dates.push(orderData.created_at);
                    }
                    else {
                        productMap.set(key, {
                            product_name: item.product_name,
                            product_category: item.product_category,
                            product_description: item.product_description,
                            total_quantity: item.quantity,
                            total_revenue: (item.unit_price * item.quantity),
                            order_ids: new Set([item.order_id]),
                            prices: [item.unit_price],
                            dates: [orderData.created_at]
                        });
                    }
                });
                // Converter para array e calcular campos adicionais
                const processedProducts = Array.from(productMap.values()).map(product => ({
                    product_name: product.product_name,
                    product_category: product.product_category,
                    product_description: product.product_description,
                    total_quantity: product.total_quantity,
                    total_revenue: product.total_revenue,
                    order_count: product.order_ids.size,
                    avg_price: product.prices.reduce((sum, p) => sum + p, 0) / product.prices.length,
                    first_sale: product.dates.sort()[0],
                    last_sale: product.dates.sort().reverse()[0]
                }));
                // Ordenar por receita total e limitar a 20
                const sortedProducts = processedProducts
                    .sort((a, b) => b.total_revenue - a.total_revenue)
                    .slice(0, 20);
                setTopProducts(sortedProducts);
                console.log('✅ Produtos mais vendidos processados (fallback):', {
                    total: sortedProducts.length,
                    samples: sortedProducts.slice(0, 2)
                });
            }
            else {
                setTopProducts(productsData || []);
                console.log('✅ Produtos mais vendidos obtidos:', {
                    total: productsData?.length || 0,
                    samples: productsData?.slice(0, 2)
                });
            }
        }
        catch (err) {
            console.error('❌ Erro ao buscar produtos mais vendidos:', err);
            setError(`Erro ao carregar produtos: ${err.message}`);
        }
        finally {
            setTopProductsLoading(false);
        }
    }, [gatewayId, timeRange, getDateRange]);
    // Função para buscar vendas ao longo do tempo
    const fetchSalesOverTime = useCallback(async () => {
        if (!gatewayId)
            return;
        setSalesOverTimeLoading(true);
        setError(null);
        try {
            console.log('🔄 [SALES OVER TIME] Buscando vendas ao longo do tempo...');
            const { start, end } = getDateRange(timeRange);
            // Buscar todos os pedidos do período
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('id, amount, created_at')
                .eq('gateway_id', gatewayId)
                .gte('created_at', start)
                .lte('created_at', end)
                .order('created_at', { ascending: true });
            if (ordersError) {
                console.error('❌ Erro ao buscar vendas over time:', ordersError);
                throw ordersError;
            }
            // Agrupar dados por período
            const salesMap = new Map();
            (ordersData || []).forEach((order) => {
                const date = new Date(order.created_at);
                let key;
                // Definir granularidade baseada no período
                switch (timeRange) {
                    case 'today':
                        key = `${date.getHours()}:00`;
                        break;
                    case 'week':
                        key = date.toLocaleDateString('pt-BR');
                        break;
                    case 'month':
                        key = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                        break;
                    case 'year':
                        key = `${date.getMonth() + 1}/${date.getFullYear()}`;
                        break;
                    default:
                        key = date.toLocaleDateString('pt-BR');
                }
                const existing = salesMap.get(key);
                if (existing) {
                    existing.sales += 1;
                    existing.revenue += order.amount || 0;
                    existing.orders += 1;
                }
                else {
                    salesMap.set(key, {
                        sales: 1,
                        revenue: order.amount || 0,
                        orders: 1
                    });
                }
            });
            // Converter para array e ordenar
            const salesData = Array.from(salesMap.entries())
                .map(([date, data]) => ({
                date,
                sales: data.sales,
                revenue: data.revenue,
                orders: data.orders
            }))
                .sort((a, b) => {
                // Ordenação customizada baseada no período
                if (timeRange === 'today') {
                    return parseInt(a.date) - parseInt(b.date);
                }
                return a.date.localeCompare(b.date);
            });
            setSalesOverTime(salesData);
            console.log('✅ Dados de vendas over time obtidos:', {
                total: salesData.length,
                samples: salesData.slice(0, 3)
            });
        }
        catch (err) {
            console.error('❌ Erro ao buscar vendas over time:', err);
            setError(`Erro ao carregar dados temporais: ${err.message}`);
        }
        finally {
            setSalesOverTimeLoading(false);
        }
    }, [gatewayId, timeRange, getDateRange]);
    // Função para buscar distribuição por categoria
    const fetchCategoryDistribution = useCallback(async () => {
        if (!gatewayId)
            return;
        setCategoryDistributionLoading(true);
        setError(null);
        try {
            console.log('🔄 [CATEGORY DISTRIBUTION] Buscando distribuição por categoria...');
            const { start, end } = getDateRange(timeRange);
            // Buscar dados de produtos por categoria
            const { data: categoryData, error: categoryError } = await supabase
                .from('order_items')
                .select(`
          product_category,
          quantity,
          unit_price,
          orders!inner(
            id,
            gateway_id,
            created_at
          )
        `)
                .eq('orders.gateway_id', gatewayId)
                .gte('orders.created_at', start)
                .lte('orders.created_at', end);
            if (categoryError) {
                console.error('❌ Erro ao buscar distribuição por categoria:', categoryError);
                throw categoryError;
            }
            // Agrupar por categoria
            const categoryMap = new Map();
            (categoryData || []).forEach((item) => {
                const category = item.product_category || 'Sem categoria';
                const revenue = (item.unit_price || 0) * (item.quantity || 0);
                const existing = categoryMap.get(category);
                if (existing) {
                    existing.count += item.quantity || 0;
                    existing.revenue += revenue;
                }
                else {
                    categoryMap.set(category, {
                        count: item.quantity || 0,
                        revenue: revenue
                    });
                }
            });
            // Cores para as categorias
            const colors = [
                '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c',
                '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb',
                '#dda0dd', '#98fb98', '#f0e68c', '#ff6347'
            ];
            // Converter para array e ordenar por receita
            const categoryArray = Array.from(categoryMap.entries())
                .map(([category, data], index) => ({
                category,
                count: data.count,
                revenue: data.revenue,
                color: colors[index % colors.length]
            }))
                .sort((a, b) => b.revenue - a.revenue);
            setCategoryDistribution(categoryArray);
            console.log('✅ Distribuição por categoria obtida:', {
                total: categoryArray.length,
                samples: categoryArray.slice(0, 3)
            });
        }
        catch (err) {
            console.error('❌ Erro ao buscar distribuição por categoria:', err);
            setError(`Erro ao carregar distribuição: ${err.message}`);
        }
        finally {
            setCategoryDistributionLoading(false);
        }
    }, [gatewayId, timeRange, getDateRange]);
    // Função principal para atualizar dashboard
    const refreshDashboard = useCallback(async () => {
        console.log('🔄 Atualizando dashboard completo...');
        await Promise.all([
            fetchStats(),
            fetchRecentOrders(),
            fetchTopProducts(),
            fetchSalesOverTime(),
            fetchCategoryDistribution()
        ]);
    }, [fetchStats, fetchRecentOrders, fetchTopProducts, fetchSalesOverTime, fetchCategoryDistribution]);
    // Carregar dados quando o gatewayId estiver disponível ou período mudar
    useEffect(() => {
        if (gatewayId) {
            refreshDashboard();
        }
    }, [gatewayId, timeRange, refreshDashboard]);
    // Fechar dropdown quando clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownOpen && !event.target.closest('.relative')) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);
    // Função para logout
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/login');
        }
        catch (err) {
            console.error('Erro ao fazer logout:', err);
        }
    };
    // Função para buscar pedido por código de rastreamento
    const handleTrackingSearch = async () => {
        if (!trackingCode.trim())
            return;
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id, tracking_code')
                .eq('tracking_code', trackingCode.trim())
                .maybeSingle();
            if (error) {
                console.error('Erro ao buscar código:', error);
                alert('Erro ao buscar código de rastreamento');
                return;
            }
            if (!data) {
                alert('Código de rastreamento não encontrado');
                return;
            }
            navigate(`/tracking/${trackingCode.trim()}`);
        }
        catch (err) {
            console.error('Erro ao buscar código:', err);
            alert('Erro ao buscar código de rastreamento');
        }
    };
    // Função para lidar com o sucesso do modal de criação de pedidos
    const handleNewOrderSuccess = () => {
        refreshDashboard();
    };
    // Função para obter descrição do período
    const getPeriodDescription = (range) => {
        switch (range) {
            case 'today':
                return `Hoje (${new Date().toLocaleDateString('pt-BR')})`;
            case 'week':
                return 'Últimos 7 dias';
            case 'month':
                return 'Este mês';
            case 'year':
                return 'Este ano';
            default:
                return '';
        }
    };
    // Função para obter label do período
    const getPeriodLabel = (range) => {
        switch (range) {
            case 'today':
                return '📅 Hoje';
            case 'week':
                return '📊 Últimos 7 dias';
            case 'month':
                return '📈 Este Mês';
            case 'year':
                return '🗓️ Este Ano';
            default:
                return '';
        }
    };
    // Função para selecionar período
    const handlePeriodSelect = (range) => {
        setTimeRange(range);
        setDropdownOpen(false);
    };
    // Função para exportar dados para CSV
    const exportToCSV = useCallback((data, filename, type) => {
        try {
            let csvContent = '';
            if (type === 'orders') {
                csvContent = 'Nome do Cliente,Valor,Status,Data,Código de Rastreamento\n';
                data.forEach((order) => {
                    csvContent += `"${order.customer_name}","${formatCurrency(order.amount / 100)}","${order.status}","${new Date(order.created_at).toLocaleDateString('pt-BR')}","${order.tracking_code || 'N/A'}"\n`;
                });
            }
            else if (type === 'products') {
                csvContent = 'Produto,Categoria,Quantidade Vendida,Receita Total,Número de Pedidos,Ticket Médio\n';
                data.forEach((product) => {
                    csvContent += `"${product.product_name}","${product.product_category || 'Sem categoria'}","${product.total_quantity}","${formatCurrency(product.total_revenue / 100)}","${product.order_count}","${formatCurrency(product.avg_price / 100)}"\n`;
                });
            }
            else if (type === 'sales') {
                csvContent = 'Data,Vendas,Receita,Pedidos\n';
                data.forEach((sale) => {
                    csvContent += `"${sale.date}","${sale.sales}","${formatCurrency(sale.revenue / 100)}","${sale.orders}"\n`;
                });
            }
            else if (type === 'categories') {
                csvContent = 'Categoria,Quantidade,Receita\n';
                data.forEach((category) => {
                    csvContent += `"${category.category}","${category.count}","${formatCurrency(category.revenue / 100)}"\n`;
                });
            }
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `${filename}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                // Feedback visual
                alert(`Dados exportados com sucesso! Arquivo: ${filename}.csv`);
            }
        }
        catch (error) {
            console.error('Erro ao exportar dados:', error);
            alert('Erro ao exportar dados. Tente novamente.');
        }
    }, []);
    // Função para visualizar detalhes do pedido
    const handleViewOrder = useCallback((order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
        setShowOrderMenu(null);
    }, []);
    // Função para abrir menu de opções do pedido
    const handleOrderMenu = useCallback((orderId) => {
        setShowOrderMenu(showOrderMenu === orderId ? null : orderId);
    }, [showOrderMenu]);
    // Função para copiar código de rastreamento
    const handleCopyTrackingCode = useCallback((trackingCode) => {
        if (trackingCode && trackingCode !== 'N/A') {
            navigator.clipboard.writeText(trackingCode).then(() => {
                alert('Código de rastreamento copiado para a área de transferência!');
            }).catch(() => {
                alert('Erro ao copiar código de rastreamento');
            });
        }
        setShowOrderMenu(null);
    }, []);
    // Função para navegar para detalhes do pedido
    const handleNavigateToOrder = useCallback((orderId) => {
        navigate(`/order/${orderId}`);
        setShowOrderMenu(null);
    }, [navigate]);
    // Opções do dropdown
    const periodOptions = [
        { value: 'today', label: '📅 Hoje' },
        { value: 'week', label: '📊 Últimos 7 dias' },
        { value: 'month', label: '📈 Este Mês' },
        { value: 'year', label: '🗓️ Este Ano' }
    ];
    // Loading inicial
    if (loading && !user) {
        return (_jsxs("div", { className: "flex justify-center items-center h-64", children: [_jsx(RefreshCw, { className: "w-8 h-8 animate-spin text-blue-500" }), _jsx("span", { className: "ml-2", children: "Carregando..." })] }));
    }
    // Erro de autenticação
    if (error && !user) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mr-2" }), _jsx("p", { className: "text-red-700", children: error })] }) }));
    }
    // Se não há gatewayId
    if (!gatewayId) {
        return (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mr-2" }), _jsx("p", { className: "text-red-700", children: "Gateway ID n\u00E3o encontrado para este usu\u00E1rio" })] }) }));
    }
    return (_jsxs("div", { className: "p-3 sm:p-6 max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h1", { className: "text-xl sm:text-2xl font-bold text-gray-900 truncate", children: "Dashboard do Gateway" }), _jsxs("p", { className: "text-sm sm:text-base text-gray-600 mt-1 truncate", children: ["Usu\u00E1rio: ", user?.email, " | Gateway: ", gatewayId] }), _jsxs("p", { className: "text-xs sm:text-sm text-gray-500 mt-1", children: ["\u00DAltima atualiza\u00E7\u00E3o: ", lastUpdated.toLocaleString('pt-BR'), " | Per\u00EDodo: ", getPeriodDescription(timeRange)] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 sm:gap-4", children: [_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setDropdownOpen(!dropdownOpen), onKeyDown: (e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setDropdownOpen(!dropdownOpen);
                                            }
                                        }, "aria-label": "Selecionar per\u00EDodo de tempo", "aria-expanded": dropdownOpen, "aria-haspopup": "listbox", className: "flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px] sm:min-w-[160px]", children: [_jsx("span", { children: getPeriodLabel(timeRange) }), _jsx(ChevronDown, { className: `w-4 h-4 ml-2 transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}` })] }), dropdownOpen && (_jsx("div", { className: "absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-20", role: "listbox", "aria-label": "Op\u00E7\u00F5es de per\u00EDodo", children: periodOptions.map((option) => (_jsx("button", { onClick: () => handlePeriodSelect(option.value), onKeyDown: (e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handlePeriodSelect(option.value);
                                                }
                                            }, role: "option", "aria-selected": timeRange === option.value, className: `w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 first:rounded-t-md last:rounded-b-md ${timeRange === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`, children: option.label }, option.value))) }))] }), _jsxs(Button, { onClick: () => setShowNewOrderModal(true), variant: "primary", size: "sm", "aria-label": "Criar novo pedido", className: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-2 focus:ring-indigo-500", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), _jsx("span", { className: "hidden sm:inline", children: "Novo Pedido" }), _jsx("span", { className: "sm:hidden", children: "Novo" })] }), _jsxs(Button, { onClick: refreshDashboard, variant: "outline", size: "sm", disabled: statsLoading || loading, "aria-label": "Atualizar dados do dashboard", className: "focus:ring-2 focus:ring-blue-500", children: [_jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${(statsLoading || loading) ? 'animate-spin' : ''}` }), _jsx("span", { className: "hidden sm:inline", children: "Atualizar" })] }), _jsxs(Button, { onClick: handleLogout, variant: "outline", size: "sm", "aria-label": "Sair do sistema", className: "focus:ring-2 focus:ring-red-500", children: [_jsx(LogOut, { className: "w-4 h-4 mr-2" }), _jsx("span", { className: "hidden sm:inline", children: "Sair" })] })] })] }), error && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-6", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mr-2" }), _jsx("p", { className: "text-red-700", children: error })] }), _jsx(Button, { onClick: refreshDashboard, variant: "outline", size: "sm", className: "mt-2", children: "Tentar Novamente" })] })), _jsx("div", { className: "mb-6", children: _jsx("div", { className: "border-b border-gray-200", children: _jsxs("nav", { className: "-mb-px flex flex-wrap sm:flex-nowrap sm:space-x-8", role: "tablist", children: [_jsxs("button", { onClick: () => setActiveTab('dashboard'), role: "tab", "aria-selected": activeTab === 'dashboard', "aria-controls": "dashboard-panel", className: `flex-1 sm:flex-none whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${activeTab === 'dashboard'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx(ShoppingBag, { className: "w-4 h-4 inline mr-1 sm:mr-2" }), _jsx("span", { className: "hidden sm:inline", children: "Dashboard Principal" }), _jsx("span", { className: "sm:hidden", children: "Dashboard" })] }), _jsxs("button", { onClick: () => setActiveTab('products'), role: "tab", "aria-selected": activeTab === 'products', "aria-controls": "products-panel", className: `flex-1 sm:flex-none whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${activeTab === 'products'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx(Package, { className: "w-4 h-4 inline mr-1 sm:mr-2" }), _jsx("span", { className: "hidden sm:inline", children: "Produtos Mais Vendidos" }), _jsx("span", { className: "sm:hidden", children: "Produtos" })] }), _jsxs("button", { onClick: () => setActiveTab('analytics'), role: "tab", "aria-selected": activeTab === 'analytics', "aria-controls": "analytics-panel", className: `flex-1 sm:flex-none whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${activeTab === 'analytics'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: [_jsx(TrendingUp, { className: "w-4 h-4 inline mr-1 sm:mr-2" }), _jsx("span", { className: "hidden sm:inline", children: "Gr\u00E1ficos Anal\u00EDticos" }), _jsx("span", { className: "sm:hidden", children: "Gr\u00E1ficos" })] })] }) }) }), activeTab === 'dashboard' && (_jsxs("div", { id: "dashboard-panel", role: "tabpanel", "aria-labelledby": "dashboard-tab", children: [_jsx(Card, { className: "mb-6", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2", children: [_jsxs("div", { className: "flex items-center flex-1", children: [_jsx(Search, { className: "w-5 h-5 text-gray-400 mr-2" }), _jsx(Input, { placeholder: "Digite o c\u00F3digo de rastreamento", value: trackingCode, onChange: (e) => setTrackingCode(e.target.value), className: "flex-1", onKeyPress: (e) => e.key === 'Enter' && handleTrackingSearch(), "aria-label": "C\u00F3digo de rastreamento", "aria-describedby": "tracking-help" })] }), _jsx(Button, { onClick: handleTrackingSearch, size: "sm", className: "w-full sm:w-auto", "aria-label": "Buscar c\u00F3digo de rastreamento", children: "Buscar" })] }), _jsx("p", { id: "tracking-help", className: "text-xs text-gray-500 mt-2", children: "Pressione Enter ou clique em Buscar para encontrar o pedido" })] }) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6", children: [_jsx(StatCard, { title: "Total de Pedidos", value: stats.totalOrders, icon: ShoppingBag, color: "primary", loading: statsLoading, trend: { value: 12, direction: "up" }, subtitle: "\u00DAltimos 30 dias" }), _jsx(StatCard, { title: "Pedidos Pendentes", value: stats.pendingOrders, icon: Clock, color: "warning", loading: statsLoading, trend: { value: 8, direction: "down" }, subtitle: "Aguardando processamento" }), _jsx(StatCard, { title: "Pedidos Conclu\u00EDdos", value: stats.completedOrders, icon: CheckCircle, color: "success", loading: statsLoading, trend: { value: 15, direction: "up" }, subtitle: "Conclu\u00EDdos hoje" }), _jsx(StatCard, { title: "Receita Total", value: formatCurrency(stats.totalRevenue / 100), icon: DollarSign, color: "primary", loading: statsLoading, trend: { value: 23, direction: "up" }, subtitle: "Faturamento acumulado" })] }), _jsx(OrdersTable, { orders: orders, loading: loading, exportToCSV: exportToCSV, handleViewOrder: handleViewOrder, handleOrderMenu: handleOrderMenu, showOrderMenu: showOrderMenu, handleNavigateToOrder: handleNavigateToOrder, handleCopyTrackingCode: handleCopyTrackingCode, navigate: navigate })] })), activeTab === 'products' && (_jsx("div", { id: "products-panel", role: "tabpanel", "aria-labelledby": "products-tab", className: "space-y-6", children: _jsx(TopProductsTable, { products: topProducts, loading: topProductsLoading }) })), activeTab === 'analytics' && (_jsx("div", { id: "analytics-panel", role: "tabpanel", "aria-labelledby": "analytics-tab", className: "space-y-6", children: _jsx(ChartsContainer, { salesData: salesOverTime, salesLoading: salesOverTimeLoading, categoryData: categoryDistribution, categoryLoading: categoryDistributionLoading, topProductsData: topProducts, topProductsLoading: topProductsLoading, exportToCSV: exportToCSV }) })), _jsx(NewOrderModal, { isOpen: showNewOrderModal, onClose: () => setShowNewOrderModal(false), onSuccess: handleNewOrderSuccess, user: user }), showOrderDetails && selectedOrder && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Detalhes do Pedido" }), _jsx("button", { onClick: () => setShowOrderDetails(false), className: "text-gray-400 hover:text-gray-600", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "ID do Pedido" }), _jsx("p", { className: "text-sm text-gray-900 bg-gray-50 p-2 rounded", children: selectedOrder.id })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Cliente" }), _jsx("p", { className: "text-sm text-gray-900 bg-gray-50 p-2 rounded", children: selectedOrder.customer_name })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Valor" }), _jsx("p", { className: "text-sm text-gray-900 bg-gray-50 p-2 rounded font-semibold text-green-600", children: formatCurrency(selectedOrder.amount / 100) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Status" }), _jsx("p", { className: "text-sm text-gray-900 bg-gray-50 p-2 rounded", children: _jsx("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedOrder.status === 'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : selectedOrder.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'}`, children: selectedOrder.status === 'completed' ? 'Concluído' :
                                                                selectedOrder.status === 'pending' ? 'Pendente' : 'Falhou' }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Data de Cria\u00E7\u00E3o" }), _jsx("p", { className: "text-sm text-gray-900 bg-gray-50 p-2 rounded", children: new Date(selectedOrder.created_at).toLocaleString('pt-BR') })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "C\u00F3digo de Rastreamento" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "text-sm text-gray-900 bg-gray-50 p-2 rounded flex-1 font-mono", children: selectedOrder.tracking_code || 'N/A' }), selectedOrder.tracking_code && selectedOrder.tracking_code !== 'N/A' && (_jsx("button", { onClick: () => handleCopyTrackingCode(selectedOrder.tracking_code || ''), className: "p-2 text-blue-600 hover:text-blue-800", title: "Copiar c\u00F3digo", children: _jsx(Hash, { className: "w-4 h-4" }) }))] })] })] }), _jsxs("div", { className: "flex justify-end gap-2 mt-6", children: [_jsx(Button, { variant: "outline", onClick: () => setShowOrderDetails(false), children: "Fechar" }), selectedOrder.tracking_code && selectedOrder.tracking_code !== 'N/A' && (_jsx(Button, { variant: "primary", onClick: () => {
                                                    navigate(`/tracking/${selectedOrder.tracking_code}`);
                                                    setShowOrderDetails(false);
                                                }, children: "Rastrear Pedido" }))] })] })] }) }) }))] }));
}
