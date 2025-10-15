import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { AlertCircle, Search, Filter, ChevronLeft, ChevronRight, ExternalLink, Package, FileText } from 'lucide-react';
import { Card, CardContent, Input, Button } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { generateInvoiceToken } from '../utils/tokenUtils';

// Definir interface para os pedidos
interface Order {
  id: string;
  status: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  payment_status: string | null;
  payment_id: string | null;
  tracking_code: string;
}

export default function GatewayOrders() {
  const { gatewayId } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
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
const isCacheValid = (cacheData: any) => {
  if (!cacheData) return false;
  
  // Verificar se o cache tem menos de 5 minutos (300000 ms)
  const cacheAge = Date.now() - cacheData.timestamp;
  return cacheAge < 300000;
};

// Função para salvar dados no cache
const saveToCache = (data: Order[], gatewayId: string, statusFilter: string | null) => {
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
  } catch (err) {
    console.warn('Não foi possível salvar no cache:', err);
  }
};

// Função para carregar dados do cache
const loadFromCache = (gatewayId: string, statusFilter: string | null): Order[] | null => {
  const cacheKey = `orders_cache_${gatewayId}_${statusFilter || 'all'}`;
  
  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (!cachedData) return null;
    
    const parsedCache = JSON.parse(cachedData);
    
    // Verificar se o cache é válido e corresponde aos parâmetros atuais
    if (isCacheValid(parsedCache) &&
        parsedCache.gatewayId === gatewayId &&
        parsedCache.statusFilter === statusFilter) {
      console.log('Usando dados do cache local');
      return parsedCache.data;
    }
    
    return null;
  } catch (err) {
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
        ]) as any;

        if (result.error) {
          console.error('Erro retornado pelo Supabase:', result.error);
          throw result.error;
        }

        data = result.data;
        success = true;
        
      } catch (err: any) {
        console.error(`Erro na tentativa ${attempts}:`, err.message);
        console.error('Stack trace:', err.stack);
        
        // Verificar se deve tentar novamente
        const shouldRetry =
          err.message.includes('timeout') ||
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
      } catch (err: any) {
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
  const formatDate = (dateString: string) => {
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
  const getStatusClass = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
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
  const getPaymentStatusClass = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
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
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-indigo-600">Carregando pedidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Tentar novamente
        </button>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-lg shadow-md p-6 text-white">
        <h1 className="text-2xl font-bold">Lista de Pedidos</h1>
        <p className="text-indigo-100 mt-1">
          Visualize e gerencie todos os pedidos processados por este gateway.
        </p>
        <div className="mt-4 bg-white/10 rounded-lg p-2 text-sm inline-flex items-center">
          <span className="font-medium mr-2">Dica:</span> Use os botões de rastreio e nota fiscal para visualizar detalhes completos do pedido
        </div>
      </div>

      {/* Filtros e pesquisa */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Pesquisar por nome, email, ID ou código de rastreio"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              leftIcon={<Search className="w-5 h-5 text-gray-400" />}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-colors"
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="processing">Em processamento</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de pedidos */}
      <Card>
        <CardContent className="p-0">
          {currentOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Nenhum pedido encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pagamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código de Rastreio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{order.customer_name}</div>
                        <div className="text-xs text-gray-400">{order.customer_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusClass(order.payment_status)}`}>
                          {order.payment_status || 'N/A'}
                        </span>
                        {order.payment_id && (
                          <div className="text-xs text-gray-400 mt-1">
                            ID: {order.payment_id.substring(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-indigo-500" />
                          <span className="text-indigo-600 font-medium">{order.tracking_code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center space-x-1 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                            onClick={() => window.open(`/tracking/${order.tracking_code}`, '_blank')}
                            title="Visualizar rastreio"
                          >
                            <Package className="w-4 h-4" />
                            <span>Rastreio</span>
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center space-x-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            onClick={() => {
                              const invoiceToken = generateInvoiceToken(order.id, order.tracking_code);
                              window.open(`/invoice/${invoiceToken}`, '_blank');
                            }}
                            title="Visualizar nota fiscal"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Nota Fiscal</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {filteredOrders.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Mostrando {indexOfFirstOrder + 1} a {Math.min(indexOfLastOrder, filteredOrders.length)} de {filteredOrders.length} pedidos
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1"
              variant="outline"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1"
              variant="outline"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}