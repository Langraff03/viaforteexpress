import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
// ✅ Removido import vulnerável - usando apenas supabase (ANON_KEY) + RLS
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  DollarSign,
  RefreshCw,
  Search,
  Eye,
  Plus,
  AlertCircle,
  LogOut,
  ChevronDown,
  Package,
  TrendingUp,
  Calendar,
  Hash,
  BarChart3,
  PieChart,
  LineChart,
  Info,
  Activity,
  Zap,
  Star,
  Filter,
  Download,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Globe
} from 'lucide-react';
import { Card, CardContent, Button, Input } from '../components/ui';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { NewOrderModal } from '../components/ui/NewOrderModal';
import { ProductStats, DashboardTab } from '../types';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar
} from 'recharts';

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

// Tipos de dados
interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

interface Order {
  id: string;
  customer_name: string;
  amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  tracking_code?: string;
}

type TimeRange = 'today' | 'week' | 'month' | 'year';

// Tipos para gráficos
interface SalesDataPoint {
  date: string;
  sales: number;
  revenue: number;
  orders: number;
}

interface CategoryData {
  category: string;
  count: number;
  revenue: number;
  color: string;
}

interface TopProductChartData {
  name: string;
  revenue: number;
  quantity: number;
  orders: number;
}

// Componente de Loading Skeleton
const SkeletonLoader = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded-md ${className}`}
       style={{
         animation: 'shimmer 1.5s infinite linear',
         backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
       }} />
);

// Componente do Card de Estatística Melhorado
const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  loading = false,
  trend,
  subtitle
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: 'primary' | 'success' | 'warning' | 'error';
  loading?: boolean;
  trend?: { value: number; direction: 'up' | 'down' };
  subtitle?: string;
}) => {
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

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white hover:scale-[1.02] relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-60`} />
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
              {trend && (
                <span className={`flex items-center text-xs px-2 py-1 rounded-full ${
                  trend.direction === 'up'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {trend.direction === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            
            <div className="mb-2">
              {loading ? (
                <SkeletonLoader className="h-8 w-32" />
              ) : (
                <h3 className={`text-3xl font-bold ${config.textColor} transition-colors duration-200`}>
                  {value}
                </h3>
              )}
            </div>
            
            {subtitle && (
              <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
            )}
          </div>
          
          <div className={`p-4 rounded-2xl ${config.iconBg} shadow-lg transform transition-transform duration-200 group-hover:scale-110`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de Tooltip Customizado
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          let displayValue = entry.value;
          let displayLabel = entry.name;
          
          if (formatter) {
            const formatterResult = formatter(entry.value, entry.name);
            if (Array.isArray(formatterResult)) {
              displayValue = formatterResult[0];
              displayLabel = formatterResult[1];
            } else {
              displayValue = formatterResult;
            }
          }
          
          return (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{displayLabel}:</span>
              <span className="text-sm font-semibold text-gray-800">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// Componente da Tabela de Pedidos Melhorado
const OrdersTable = ({
  orders,
  loading,
  exportToCSV,
  handleViewOrder,
  handleOrderMenu,
  showOrderMenu,
  handleNavigateToOrder,
  handleCopyTrackingCode,
  navigate
}: {
  orders: Order[];
  loading: boolean;
  exportToCSV: (data: any[], filename: string, type: 'orders' | 'products' | 'sales' | 'categories') => void;
  handleViewOrder: (order: Order) => void;
  handleOrderMenu: (orderId: string) => void;
  showOrderMenu: string | null;
  handleNavigateToOrder: (orderId: string) => void;
  handleCopyTrackingCode: (trackingCode: string) => void;
  navigate: (path: string) => void;
}) => {
  const getStatusConfig = (status: string) => {
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
    return configs[status as keyof typeof configs] || configs.pending;
  };

  return (
    <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Pedidos Recentes</h3>
                <p className="text-sm text-gray-500">Últimos pedidos do período selecionado</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <Activity className="w-4 h-4" />
                <span>{orders.length} pedidos</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(orders, 'pedidos-recentes', 'orders')}
                disabled={orders.length === 0}
                title="Exportar pedidos para CSV"
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg animate-pulse">
                  <SkeletonLoader className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <SkeletonLoader className="h-4 w-48" />
                    <SkeletonLoader className="h-3 w-32" />
                  </div>
                  <SkeletonLoader className="h-6 w-20" />
                  <SkeletonLoader className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                Não há pedidos para o período selecionado. Experimente alterar o filtro de data ou criar um novo pedido.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50">Cliente</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50">Valor</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50">Data</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50">Código</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 bg-gray-50">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200 group">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {order.customer_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{order.customer_name}</p>
                              <p className="text-sm text-gray-500">ID: {order.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-600 text-lg">
                              {formatCurrency(order.amount / 100)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.className}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded border">
                              {order.tracking_code || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOrder(order)}
                              title="Visualizar detalhes do pedido"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOrderMenu(order.id)}
                                title="Mais opções"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                              {showOrderMenu === order.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                  <button
                                    onClick={() => handleNavigateToOrder(order.id)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver detalhes
                                  </button>
                                  <button
                                    onClick={() => handleCopyTrackingCode(order.tracking_code || '')}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                    disabled={!order.tracking_code || order.tracking_code === 'N/A'}
                                  >
                                    <Hash className="w-4 h-4" />
                                    Copiar código
                                  </button>
                                  <button
                                    onClick={() => navigate(`/tracking/${order.tracking_code}`)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                    disabled={!order.tracking_code || order.tracking_code === 'N/A'}
                                  >
                                    <Package className="w-4 h-4" />
                                    Rastrear pedido
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente da Tabela de Produtos Mais Vendidos
const TopProductsTable = ({ products, loading }: { products: ProductStats[]; loading: boolean }) => (
  <Card className="border-0 shadow-md">
    <CardContent className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Produtos Mais Vendidos</h3>
        <div className="flex items-center text-sm text-gray-500">
          <Package className="w-4 h-4 mr-1" />
          {products.length} produtos
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="ml-3 text-gray-600">Carregando produtos...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Nenhum produto encontrado</p>
          <p className="text-sm mt-1">Não há produtos vendidos para o período selecionado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Produto</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Categoria</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Qtd. Vendida</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Receita Total</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Nº Pedidos</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Ticket Médio</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Primeira Venda</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Última Venda</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={`${product.product_name}-${index}`} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                  <td className="py-3 px-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{product.product_name}</span>
                      {product.product_description && (
                        <span className="text-sm text-gray-500 truncate max-w-xs">{product.product_description}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.product_category
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {product.product_category || 'Sem categoria'}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-semibold text-gray-900">
                    {product.total_quantity.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-2 font-semibold text-green-600">
                    {formatCurrency(product.total_revenue / 100)}
                  </td>
                  <td className="py-3 px-2 text-gray-600">
                    {product.order_count.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-2 font-medium text-gray-900">
                    {formatCurrency(product.avg_price / 100)}
                  </td>
                  <td className="py-3 px-2 text-gray-600">
                    {new Date(product.first_sale).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-2 text-gray-600">
                    {new Date(product.last_sale).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);

// Componente de Gráfico de Vendas ao Longo do Tempo Melhorado
const SalesChart = ({ data, loading, exportToCSV }: { data: SalesDataPoint[]; loading: boolean; exportToCSV: (data: any[], filename: string, type: 'orders' | 'products' | 'sales' | 'categories') => void; }) => (
  <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
    <CardContent className="p-0">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Vendas ao Longo do Tempo</h3>
              <p className="text-sm text-gray-500">Performance temporal das vendas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
              <LineChart className="w-4 h-4" />
              <span>{data.length} pontos</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(data, 'vendas-ao-longo-do-tempo', 'sales')}
              disabled={data.length === 0}
              title="Exportar dados de vendas para CSV"
            >
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-gray-600 font-medium">Carregando dados temporais...</p>
              <p className="text-sm text-gray-500 mt-1">Analisando tendências</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <TrendingUp className="w-12 h-12 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum dado encontrado</h4>
            <p className="text-gray-500 max-w-md mx-auto">
              Não há vendas para o período selecionado. Experimente alterar o filtro de data para ver mais dados.
            </p>
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.gradient.chart[0]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.gradient.chart[0]} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.gradient.chart[1]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.gradient.chart[1]} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={COLORS.gray[300]}
                  opacity={0.6}
                />
                
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: COLORS.gray[600] }}
                  axisLine={{ stroke: COLORS.gray[300] }}
                  tickLine={{ stroke: COLORS.gray[300] }}
                />
                
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: COLORS.gray[600] }}
                  axisLine={{ stroke: COLORS.gray[300] }}
                  tickLine={{ stroke: COLORS.gray[300] }}
                />
                
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: COLORS.gray[600] }}
                  axisLine={{ stroke: COLORS.gray[300] }}
                  tickLine={{ stroke: COLORS.gray[300] }}
                />
                
                <Tooltip
                  content={<CustomTooltip formatter={(value: any, name: string) => {
                    if (name === 'revenue') {
                      return [formatCurrency(value / 100), 'Receita'];
                    }
                    return [value, name === 'sales' ? 'Vendas' : 'Pedidos'];
                  }} />}
                />
                
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sales"
                  stroke={COLORS.gradient.chart[0]}
                  strokeWidth={3}
                  dot={{ fill: COLORS.gradient.chart[0], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.gradient.chart[0], strokeWidth: 2 }}
                  name="Vendas"
                />
                
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.gradient.chart[1]}
                  strokeWidth={3}
                  dot={{ fill: COLORS.gradient.chart[1], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.gradient.chart[1], strokeWidth: 2 }}
                  name="Receita"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Componente de Gráfico de Distribuição por Categoria Melhorado
const CategoryChart = ({ data, loading, exportToCSV }: { data: CategoryData[]; loading: boolean; exportToCSV: (data: any[], filename: string, type: 'orders' | 'products' | 'sales' | 'categories') => void; }) => {
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = (entry: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = entry;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="13"
        fontWeight="600"
        className="drop-shadow-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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

  return (
    <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Distribuição por Categoria</h3>
                <p className="text-sm text-gray-500">Análise de receita por categoria</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                <Package className="w-4 h-4" />
                <span>{data.length} categorias</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(data, 'distribuicao-por-categoria', 'categories')}
                disabled={data.length === 0}
                title="Exportar dados de categoria para CSV"
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                </div>
                <p className="text-gray-600 font-medium">Carregando distribuição...</p>
                <p className="text-sm text-gray-500 mt-1">Analisando categorias</p>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <PieChart className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma categoria encontrada</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                Não há produtos categorizados para o período selecionado. Verifique se há produtos cadastrados.
              </p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <defs>
                        {enhancedData.map((entry, index) => (
                          <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={entry.color} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={entry.color} stopOpacity={0.6}/>
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={enhancedData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={120}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="revenue"
                        stroke="white"
                        strokeWidth={2}
                      >
                        {enhancedData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#gradient-${index})`}
                            className="hover:opacity-80 transition-opacity duration-200"
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomTooltip formatter={(value: any) => [formatCurrency(value / 100), 'Receita']} />}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Resumo das categorias */}
              <div className="lg:w-80">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 mb-4">Resumo das Categorias</h4>
                  {enhancedData.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-gray-900">{category.category}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">
                        {formatCurrency(category.revenue / 100)}
                      </span>
                    </div>
                  ))}
                  {enhancedData.length > 5 && (
                    <div className="text-center py-2 text-sm text-gray-500">
                      +{enhancedData.length - 5} outras categorias
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente de Gráfico de Top Produtos Melhorado
const TopProductsChart = ({ data, loading, exportToCSV }: { data: ProductStats[]; loading: boolean; exportToCSV: (data: any[], filename: string, type: 'orders' | 'products' | 'sales' | 'categories') => void; }) => {
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

  return (
    <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Top 10 Produtos</h3>
                <p className="text-sm text-gray-500">Produtos mais vendidos por receita</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                <Package className="w-4 h-4" />
                <span>{chartData.length} produtos</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(data, 'top-produtos', 'products')}
                disabled={data.length === 0}
                title="Exportar dados de produtos para CSV"
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                </div>
                <p className="text-gray-600 font-medium">Carregando produtos...</p>
                <p className="text-sm text-gray-500 mt-1">Analisando performance</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <BarChart3 className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                Não há produtos vendidos para o período selecionado. Adicione produtos ao seu catálogo.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.gradient.chart[0]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.gradient.chart[0]} stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="quantityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.gradient.chart[1]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.gradient.chart[1]} stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={COLORS.gray[300]}
                      opacity={0.6}
                    />
                    
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12, fill: COLORS.gray[600] }}
                      axisLine={{ stroke: COLORS.gray[300] }}
                      tickLine={{ stroke: COLORS.gray[300] }}
                    />
                    
                    <YAxis
                      tick={{ fontSize: 12, fill: COLORS.gray[600] }}
                      axisLine={{ stroke: COLORS.gray[300] }}
                      tickLine={{ stroke: COLORS.gray[300] }}
                    />
                    
                    <Tooltip
                      content={<CustomTooltip formatter={(value: any, name: string) => {
                        if (name === 'revenue') {
                          return [formatCurrency(value / 100), 'Receita'];
                        }
                        return [value, name === 'quantity' ? 'Quantidade' : 'Pedidos'];
                      }} />}
                    />
                    
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    
                    <Bar
                      dataKey="revenue"
                      fill="url(#revenueGradient)"
                      name="Receita"
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                    
                    <Bar
                      dataKey="quantity"
                      fill="url(#quantityGradient)"
                      name="Quantidade"
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Resumo dos produtos */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Resumo dos Top 5 Produtos</h4>
                <div className="space-y-2">
                  {chartData.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.fullName}</p>
                          <p className="text-sm text-gray-500">{product.orders} pedidos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(product.revenue / 100)}</p>
                        <p className="text-sm text-gray-500">{product.quantity} unidades</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Container dos Gráficos
const ChartsContainer = ({
  salesData,
  salesLoading,
  categoryData,
  categoryLoading,
  topProductsData,
  topProductsLoading,
  exportToCSV
}: {
  salesData: SalesDataPoint[];
  salesLoading: boolean;
  categoryData: CategoryData[];
  categoryLoading: boolean;
  topProductsData: ProductStats[];
  topProductsLoading: boolean;
  exportToCSV: (data: any[], filename: string, type: 'orders' | 'products' | 'sales' | 'categories') => void;
}) => (
  <div className="space-y-6">
    {/* Gráfico de Vendas ao Longo do Tempo */}
    <SalesChart data={salesData} loading={salesLoading} exportToCSV={exportToCSV} />
    
    {/* Grid com Gráficos de Categoria e Top Produtos */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CategoryChart data={categoryData} loading={categoryLoading} exportToCSV={exportToCSV} />
      <TopProductsChart data={topProductsData} loading={topProductsLoading} exportToCSV={exportToCSV} />
    </div>
  </div>
);

// Componente Principal do Dashboard
// Componente Principal do Dashboard
export default function GatewayDashboard() {
  console.log('🌐 DEBUG [GATEWAY Dashboard] Componente GatewayDashboard foi renderizado!');
  
  const navigate = useNavigate();
  
  // Estados
  const [user, setUser] = useState<any>(null);
  const [gatewayId, setGatewayId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [trackingCode, setTrackingCode] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  
  // Estados para produtos mais vendidos
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
  const [topProductsLoading, setTopProductsLoading] = useState(true);
  
  // Estados para gráficos
  const [salesOverTime, setSalesOverTime] = useState<SalesDataPoint[]>([]);
  const [salesOverTimeLoading, setSalesOverTimeLoading] = useState(true);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryData[]>([]);
  const [categoryDistributionLoading, setCategoryDistributionLoading] = useState(true);

  // Estados para modais e ações
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showOrderMenu, setShowOrderMenu] = useState<string | null>(null);

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
        
      } catch (err: any) {
        console.error('❌ Erro na verificação de autenticação:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Função para calcular datas do período
  const getDateRange = useCallback((range: TimeRange) => {
    const now = new Date();
    
    // Obter valores UTC da data atual
    const nowUTC = {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth(),
      date: now.getUTCDate()
    };
    
    let startDate: Date;
    let endDate: Date;
    
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
    if (!gatewayId) return;
    
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
      let ordersInDateRange: any[] = [];
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
      
      // Calcular estatísticas
      const totalOrders = ordersInDateRange.length;
      const pendingOrders = ordersInDateRange.filter(order =>
        order.status === 'pending' || order.payment_status === 'pending'
      ).length;
      const completedOrders = ordersInDateRange.filter(order =>
        order.status === 'completed' || order.payment_status === 'paid'
      ).length;
      const totalRevenue = ordersInDateRange.reduce((sum, order) =>
        sum + (order.amount || 0), 0
      );
      
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
      
    } catch (err: any) {
      console.error('❌ Erro ao buscar estatísticas:', err);
      setError(`Erro ao carregar estatísticas: ${err.message}`);
    } finally {
      setStatsLoading(false);
    }
  }, [gatewayId, timeRange, getDateRange]);
  // Função para buscar pedidos recentes com paginação
  const fetchRecentOrders = useCallback(async () => {
    if (!gatewayId) return;
    
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
      
    } catch (err: any) {
      console.error('❌ Erro ao buscar pedidos recentes:', err);
      setError(`Erro ao carregar pedidos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [gatewayId, timeRange, getDateRange]);
  
  // Função para buscar produtos mais vendidos
  const fetchTopProducts = useCallback(async () => {
    if (!gatewayId) return;
    
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
        const productMap = new Map<string, {
          product_name: string;
          product_category: string | null;
          product_description: string | null;
          total_quantity: number;
          total_revenue: number;
          order_ids: Set<string>;
          prices: number[];
          dates: string[];
        }>();
        
        (fallbackData || []).forEach((item: any) => {
          const key = `${item.product_name}-${item.product_category}`;
          const existing = productMap.get(key);
          const orderData = Array.isArray(item.orders) ? item.orders[0] : item.orders;
          
          if (existing) {
            existing.total_quantity += item.quantity;
            existing.total_revenue += (item.unit_price * item.quantity);
            existing.order_ids.add(item.order_id);
            existing.prices.push(item.unit_price);
            existing.dates.push(orderData.created_at);
          } else {
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
        
      } else {
        setTopProducts(productsData || []);
        
        console.log('✅ Produtos mais vendidos obtidos:', {
          total: productsData?.length || 0,
          samples: productsData?.slice(0, 2)
        });
      }
      
    } catch (err: any) {
      console.error('❌ Erro ao buscar produtos mais vendidos:', err);
      setError(`Erro ao carregar produtos: ${err.message}`);
    } finally {
      setTopProductsLoading(false);
    }
  }, [gatewayId, timeRange, getDateRange]);
  
  // Função para buscar vendas ao longo do tempo
  const fetchSalesOverTime = useCallback(async () => {
    if (!gatewayId) return;
    
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
      const salesMap = new Map<string, { sales: number; revenue: number; orders: number }>();
      
      (ordersData || []).forEach((order) => {
        const date = new Date(order.created_at);
        let key: string;
        
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
        } else {
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
      
    } catch (err: any) {
      console.error('❌ Erro ao buscar vendas over time:', err);
      setError(`Erro ao carregar dados temporais: ${err.message}`);
    } finally {
      setSalesOverTimeLoading(false);
    }
  }, [gatewayId, timeRange, getDateRange]);
  
  // Função para buscar distribuição por categoria
  const fetchCategoryDistribution = useCallback(async () => {
    if (!gatewayId) return;
    
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
      const categoryMap = new Map<string, { count: number; revenue: number }>();
      
      (categoryData || []).forEach((item: any) => {
        const category = item.product_category || 'Sem categoria';
        const revenue = (item.unit_price || 0) * (item.quantity || 0);
        
        const existing = categoryMap.get(category);
        if (existing) {
          existing.count += item.quantity || 0;
          existing.revenue += revenue;
        } else {
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
      
    } catch (err: any) {
      console.error('❌ Erro ao buscar distribuição por categoria:', err);
      setError(`Erro ao carregar distribuição: ${err.message}`);
    } finally {
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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownOpen && !(event.target as Element).closest('.relative')) {
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
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };
  
  // Função para buscar pedido por código de rastreamento
  const handleTrackingSearch = async () => {
    if (!trackingCode.trim()) return;
    
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
    } catch (err) {
      console.error('Erro ao buscar código:', err);
      alert('Erro ao buscar código de rastreamento');
    }
  };
  
  // Função para lidar com o sucesso do modal de criação de pedidos
  const handleNewOrderSuccess = () => {
    refreshDashboard();
  };
  
  // Função para obter descrição do período
  const getPeriodDescription = (range: TimeRange) => {
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
  const getPeriodLabel = (range: TimeRange) => {
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
  const handlePeriodSelect = (range: TimeRange) => {
    setTimeRange(range);
    setDropdownOpen(false);
  };

  // Função para exportar dados para CSV
  const exportToCSV = useCallback((data: any[], filename: string, type: 'orders' | 'products' | 'sales' | 'categories') => {
    try {
      let csvContent = '';
      
      if (type === 'orders') {
        csvContent = 'Nome do Cliente,Valor,Status,Data,Código de Rastreamento\n';
        data.forEach((order: Order) => {
          csvContent += `"${order.customer_name}","${formatCurrency(order.amount / 100)}","${order.status}","${new Date(order.created_at).toLocaleDateString('pt-BR')}","${order.tracking_code || 'N/A'}"\n`;
        });
      } else if (type === 'products') {
        csvContent = 'Produto,Categoria,Quantidade Vendida,Receita Total,Número de Pedidos,Ticket Médio\n';
        data.forEach((product: ProductStats) => {
          csvContent += `"${product.product_name}","${product.product_category || 'Sem categoria'}","${product.total_quantity}","${formatCurrency(product.total_revenue / 100)}","${product.order_count}","${formatCurrency(product.avg_price / 100)}"\n`;
        });
      } else if (type === 'sales') {
        csvContent = 'Data,Vendas,Receita,Pedidos\n';
        data.forEach((sale: SalesDataPoint) => {
          csvContent += `"${sale.date}","${sale.sales}","${formatCurrency(sale.revenue / 100)}","${sale.orders}"\n`;
        });
      } else if (type === 'categories') {
        csvContent = 'Categoria,Quantidade,Receita\n';
        data.forEach((category: CategoryData) => {
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
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    }
  }, []);

  // Função para visualizar detalhes do pedido
  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    setShowOrderMenu(null);
  }, []);

  // Função para abrir menu de opções do pedido
  const handleOrderMenu = useCallback((orderId: string) => {
    setShowOrderMenu(showOrderMenu === orderId ? null : orderId);
  }, [showOrderMenu]);

  // Função para copiar código de rastreamento
  const handleCopyTrackingCode = useCallback((trackingCode: string) => {
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
  const handleNavigateToOrder = useCallback((orderId: string) => {
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
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }
  
  // Erro de autenticação
  if (error && !user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  
  // Se não há gatewayId
  if (!gatewayId) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">Gateway ID não encontrado para este usuário</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header Responsivo */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            Dashboard do Gateway
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
            Usuário: {user?.email} | Gateway: {gatewayId}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Última atualização: {lastUpdated.toLocaleString('pt-BR')} |
            Período: {getPeriodDescription(timeRange)}
          </p>
        </div>
        
        {/* Controles Responsivos */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Seletor de período com acessibilidade */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDropdownOpen(!dropdownOpen);
                }
              }}
              aria-label="Selecionar período de tempo"
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px] sm:min-w-[160px]"
            >
              <span>{getPeriodLabel(timeRange)}</span>
              <ChevronDown className={`w-4 h-4 ml-2 transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-20"
                role="listbox"
                aria-label="Opções de período"
              >
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePeriodSelect(option.value as TimeRange)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePeriodSelect(option.value as TimeRange);
                      }
                    }}
                    role="option"
                    aria-selected={timeRange === option.value}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 first:rounded-t-md last:rounded-b-md ${
                      timeRange === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Botão de criar novo pedido */}
          <Button
            onClick={() => setShowNewOrderModal(true)}
            variant="primary"
            size="sm"
            aria-label="Criar novo pedido"
            className="bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Novo Pedido</span>
            <span className="sm:hidden">Novo</span>
          </Button>
          
          {/* Botão de refresh */}
          <Button
            onClick={refreshDashboard}
            variant="outline"
            size="sm"
            disabled={statsLoading || loading}
            aria-label="Atualizar dados do dashboard"
            className="focus:ring-2 focus:ring-blue-500"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(statsLoading || loading) ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          
          {/* Botão de logout */}
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            aria-label="Sair do sistema"
            className="focus:ring-2 focus:ring-red-500"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
      
      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
          <Button 
            onClick={refreshDashboard} 
            variant="outline" 
            size="sm"
            className="mt-2"
          >
            Tentar Novamente
          </Button>
        </div>
      )}
      
      {/* Sistema de Abas Responsivo */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap sm:flex-nowrap sm:space-x-8" role="tablist">
            <button
              onClick={() => setActiveTab('dashboard')}
              role="tab"
              aria-selected={activeTab === 'dashboard'}
              aria-controls="dashboard-panel"
              className={`flex-1 sm:flex-none whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShoppingBag className="w-4 h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Dashboard Principal</span>
              <span className="sm:hidden">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              role="tab"
              aria-selected={activeTab === 'products'}
              aria-controls="products-panel"
              className={`flex-1 sm:flex-none whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                activeTab === 'products'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Produtos Mais Vendidos</span>
              <span className="sm:hidden">Produtos</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              role="tab"
              aria-selected={activeTab === 'analytics'}
              aria-controls="analytics-panel"
              className={`flex-1 sm:flex-none whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                activeTab === 'analytics'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Gráficos Analíticos</span>
              <span className="sm:hidden">Gráficos</span>
            </button>
          </nav>
        </div>
      </div>
      {/* Conteúdo da Aba Dashboard */}
      {activeTab === 'dashboard' && (
        <div id="dashboard-panel" role="tabpanel" aria-labelledby="dashboard-tab">
          {/* Busca por código de rastreamento com acessibilidade */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
                <div className="flex items-center flex-1">
                  <Search className="w-5 h-5 text-gray-400 mr-2" />
                  <Input
                    placeholder="Digite o código de rastreamento"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleTrackingSearch()}
                    aria-label="Código de rastreamento"
                    aria-describedby="tracking-help"
                  />
                </div>
                <Button
                  onClick={handleTrackingSearch}
                  size="sm"
                  className="w-full sm:w-auto"
                  aria-label="Buscar código de rastreamento"
                >
                  Buscar
                </Button>
              </div>
              <p id="tracking-help" className="text-xs text-gray-500 mt-2">
                Pressione Enter ou clique em Buscar para encontrar o pedido
              </p>
            </CardContent>
          </Card>
          
          {/* Cards de estatísticas responsivos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
            <StatCard
              title="Total de Pedidos"
              value={stats.totalOrders}
              icon={ShoppingBag}
              color="primary"
              loading={statsLoading}
              trend={{ value: 12, direction: "up" }}
              subtitle="Últimos 30 dias"
            />
            
            <StatCard
              title="Pedidos Pendentes"
              value={stats.pendingOrders}
              icon={Clock}
              color="warning"
              loading={statsLoading}
              trend={{ value: 8, direction: "down" }}
              subtitle="Aguardando processamento"
            />
            
            <StatCard
              title="Pedidos Concluídos"
              value={stats.completedOrders}
              icon={CheckCircle}
              color="success"
              loading={statsLoading}
              trend={{ value: 15, direction: "up" }}
              subtitle="Concluídos hoje"
            />
            
            <StatCard
              title="Receita Total"
              value={formatCurrency(stats.totalRevenue / 100)}
              icon={DollarSign}
              color="primary"
              loading={statsLoading}
              trend={{ value: 23, direction: "up" }}
              subtitle="Faturamento acumulado"
            />
          </div>
          
          {/* Tabela de pedidos recentes */}
          <OrdersTable
            orders={orders}
            loading={loading}
            exportToCSV={exportToCSV}
            handleViewOrder={handleViewOrder}
            handleOrderMenu={handleOrderMenu}
            showOrderMenu={showOrderMenu}
            handleNavigateToOrder={handleNavigateToOrder}
            handleCopyTrackingCode={handleCopyTrackingCode}
            navigate={navigate}
          />
        </div>
      )}
      
      {/* Conteúdo da Aba Produtos */}
      {activeTab === 'products' && (
        <div id="products-panel" role="tabpanel" aria-labelledby="products-tab" className="space-y-6">
          <TopProductsTable products={topProducts} loading={topProductsLoading} />
        </div>
      )}
      
      {/* Conteúdo da Aba Gráficos Analíticos */}
      {activeTab === 'analytics' && (
        <div id="analytics-panel" role="tabpanel" aria-labelledby="analytics-tab" className="space-y-6">
          <ChartsContainer
            salesData={salesOverTime}
            salesLoading={salesOverTimeLoading}
            categoryData={categoryDistribution}
            categoryLoading={categoryDistributionLoading}
            topProductsData={topProducts}
            topProductsLoading={topProductsLoading}
            exportToCSV={exportToCSV}
          />
        </div>
      )}
      
      {/* Modal de criação de pedidos */}
      <NewOrderModal
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSuccess={handleNewOrderSuccess}
        user={user}
      />

      {/* Modal de detalhes do pedido */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Detalhes do Pedido</h2>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID do Pedido</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-semibold text-green-600">
                      {formatCurrency(selectedOrder.amount / 100)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedOrder.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : selectedOrder.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrder.status === 'completed' ? 'Concluído' :
                         selectedOrder.status === 'pending' ? 'Pendente' : 'Falhou'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código de Rastreamento</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded flex-1 font-mono">
                        {selectedOrder.tracking_code || 'N/A'}
                      </p>
                      {selectedOrder.tracking_code && selectedOrder.tracking_code !== 'N/A' && (
                        <button
                          onClick={() => handleCopyTrackingCode(selectedOrder.tracking_code || '')}
                          className="p-2 text-blue-600 hover:text-blue-800"
                          title="Copiar código"
                        >
                          <Hash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowOrderDetails(false)}
                  >
                    Fechar
                  </Button>
                  {selectedOrder.tracking_code && selectedOrder.tracking_code !== 'N/A' && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        navigate(`/tracking/${selectedOrder.tracking_code}`);
                        setShowOrderDetails(false);
                      }}
                    >
                      Rastrear Pedido
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}