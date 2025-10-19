import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  Calendar,
  Filter,
  Plus,
  Eye,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  ArrowUpDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { useAuth } from '../lib/auth';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

interface Order {
  id: string;
  tracking_code: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  status: string;
}

type SortField = 'created_at' | 'tracking_code' | 'customer_name';
type SortDirection = 'asc' | 'desc';

export default function FreelancerOrders() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Buscar pedidos do freelancer
  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['freelancer-orders', user?.id, searchTerm, statusFilter, sortField, sortDirection],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

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
        query = query.or(
          `tracking_code.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%`
        );
      }

      // Ordenação
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      
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
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
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
  const handleResendEmail = async (orderId: string) => {
    try {
      // Aqui você pode implementar a lógica para reenviar o email
      console.log('Reenviando email para pedido:', orderId);
      // Implementar chamada para API ou função de reenvio
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Enviado
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Package className="w-3 h-3 mr-1" />
            Entregue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie todos os seus pedidos de rastreamento
            </p>
          </div>
          <Link
            to="/freelancer/new-order"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Pedido
          </Link>
        </div>

        {/* Filtros e Pesquisa */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Barra de Pesquisa */}
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por código, nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Filtro de Status */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">Pendentes</option>
                  <option value="sent">Enviados</option>
                  <option value="delivered">Entregues</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Pedidos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
              </h2>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-1" />
                Atualizar
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
                <span className="ml-3 text-emerald-600">Carregando pedidos...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar pedidos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tente novamente em alguns instantes.
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : paginatedOrders.length > 0 ? (
              <>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('tracking_code')}
                        >
                          <div className="flex items-center">
                            Código
                            <ArrowUpDown className="w-4 h-4 ml-1" />
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('customer_name')}
                        >
                          <div className="flex items-center">
                            Cliente
                            <ArrowUpDown className="w-4 h-4 ml-1" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('created_at')}
                        >
                          <div className="flex items-center">
                            Data
                            <ArrowUpDown className="w-4 h-4 ml-1" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedOrders.map((order: Order) => (
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
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <a
                                href={`https://rastreio.viaforteexpress.com/tracking/${order.tracking_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-900"
                                title="Ver rastreamento"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              {order.status === 'created' && (
                                <button
                                  onClick={() => handleResendEmail(order.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Reenviar email"
                                >
                                  <Mail className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                      Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredOrders.length)} de {filteredOrders.length} resultados
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Página {currentPage} de {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm || statusFilter !== 'all' ? 'Nenhum pedido encontrado' : 'Nenhum pedido ainda'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de pesquisa.'
                    : 'Comece criando seu primeiro pedido de rastreamento.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <div className="mt-6">
                    <Link
                      to="/freelancer/new-order"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Pedido
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}