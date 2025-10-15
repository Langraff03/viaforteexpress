// src/pages/Orders.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  Mail,
  Plus,
  Loader2
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '../components/ui/Table';
import { useNavigate } from 'react-router-dom';
import { NewOrderModal } from '../components/ui/NewOrderModal';

import { Order } from '../types';

interface ExpandedRows {
  [key: string]: boolean;
}

interface OrdersResponse {
  data: Order[];
  count: number;
}

export default function Orders() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAddressFilter, setSelectedAddressFilter] = useState<string>('all');
  const [selectedEmailFilter, setSelectedEmailFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [expandedRows, setExpandedRows] = useState<ExpandedRows>({});
  const [timeoutError, setTimeoutError] = useState<Error | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // debounce (atraso para evitar múltiplas requisições) searchTerm
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
const {
  data: ordersData,
  isLoading: queryLoading,
  isFetching,
  error: queryError
} = useQuery({
  queryKey: ['orders', page, selectedStatus, selectedAddressFilter, selectedEmailFilter, debouncedSearch],
  queryFn: async (): Promise<OrdersResponse> => { // Tipo de retorno explícito
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
      } else if (selectedAddressFilter === 'without_address') {
        query = query.eq('has_shipping_address', false);
      } else if (selectedAddressFilter === 'not_validated') {
        query = query.is('has_shipping_address', null);
      }

      // NOVO: Filtro de email
      if (selectedEmailFilter === 'email_sent') {
        query = query.eq('email_sent', true);
      } else if (selectedEmailFilter === 'email_not_sent') {
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
        return { data: (data as Order[] | null) ?? [], count: count ?? 0 };
      } catch (err) {
        console.error('Erro na busca de pedidos:', err);
        throw err;
      }
    },
    placeholderData: (previousData: any) => previousData,
    staleTime: 60_000, // 1 minuto
    gcTime: 300_000, // 5 minutos (anteriormente chamado cacheTime)
    refetchOnWindowFocus: false, // Desativar refetch automático ao focar na janela
    retry: 1,
    retryDelay: 1_000
  });
  
  // Efeito para timeout de carregamento
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    if (queryLoading) {
      timeoutId = setTimeout(() => {
        console.log('Timeout de carregamento atingido na página de pedidos');
        setTimeoutError(new Error('Tempo limite de carregamento excedido. Tente novamente.'));
      }, 10000); // 10 segundos
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [queryLoading]);
  
  // Combinar erros de query e timeout
  const error = timeoutError || queryError;
  const isLoading = queryLoading && !timeoutError;

  const totalPages = Math.ceil((ordersData?.count || 0) / pageSize);
  const orders: Order[] = ordersData?.data || []; // Tipar explicitamente orders

  function getStatusColor(status: string) {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  function getStatusText(status: string) {
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

  function toggleRow(id: string) {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function formatCurrency(value: number) {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    return value ? formatter.format(value / 100) : '—';
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-indigo-600">Carregando pedidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar pedidos</h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <Button
          variant="primary"
          onClick={() => {
            setTimeoutError(null);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
          }}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-gray-500">Gerencie e rastreie seus pedidos</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowNewOrderModal(true)}
        >
          Novo Pedido
        </Button>
      </header>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-indigo-500"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="border rounded-md px-3 py-2"
          value={selectedStatus}
          onChange={e => {
            setSelectedStatus(e.target.value as any);
            setPage(1);
          }}
        >
          <option value="all">Todos os Status</option>
          <option value="pending">Pendente</option>
          <option value="processing">Em Processamento</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregue</option>
          <option value="cancelled">Cancelado</option>
        </select>

        {/* NOVO: Filtros para endereço e email */}
        <div className="flex gap-2">
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={selectedAddressFilter || 'all'}
            onChange={e => {
              setSelectedAddressFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Todos Endereços</option>
            <option value="with_address">Com Endereço</option>
            <option value="without_address">Sem Endereço</option>
            <option value="not_validated">Não Validado</option>
          </select>

          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={selectedEmailFilter || 'all'}
            onChange={e => {
              setSelectedEmailFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Todos Emails</option>
            <option value="email_sent">Email Enviado</option>
            <option value="email_not_sent">Email Não Enviado</option>
          </select>
        </div>
      </div>

      <Card>
        {orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum pedido encontrado</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">&nbsp;</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <React.Fragment key={order.id}>
                    <TableRow className="hover:bg-gray-50">
                      <TableCell className="w-8">
                        <button
                          onClick={() => toggleRow(order.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedRows[order.id] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="text-indigo-600">{order.tracking_code}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[200px]">{order.customer_email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                          {order.payment_status ? (
                            <span className="block text-xs text-gray-500">
                              Pagamento: {order.payment_status === 'paid' ? 'Confirmado' : order.payment_status}
                            </span>
                          ) : null}

                          {/* NOVO: Indicadores de endereço e email */}
                          <div className="flex gap-1 mt-1">
                            {order.has_shipping_address === true ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                📍 Endereço OK
                              </span>
                            ) : order.has_shipping_address === false ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                📍 Sem Endereço
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                📍 Não Validado
                              </span>
                            )}

                            {order.email_sent ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                📧 Email Enviado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                📧 Email Pendente
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>
                            Criado em {format(new Date(order.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                          </div>
                          <div>
                            Atualizado em {format(new Date(order.updated_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye className="w-4 h-4" />}
                            onClick={() => {
                              // Usar navigate em vez de window.open para manter o contexto da aplicação
                              navigate(`/tracking/${order.tracking_code}`);
                            }}
                          >
                            Ver
                          </Button>
                          <Button variant="outline" size="sm" leftIcon={<Mail className="w-4 h-4" />}>
                            Reenviar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows[order.id] && (
                      <TableRow className="bg-gray-50"> {/* Opcional: fundo ligeiramente diferente para toda a linha expandida */}
                        <TableCell colSpan={6}> {/* Tentando usar colSpan diretamente */}
                          <div className="p-4 border-t border-gray-200"> {/* Contêiner principal para detalhes expandidos */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {/* Seção 1: Detalhes do Cliente */}
                              <div className="p-3 bg-white rounded shadow">
                                <h5 className="font-semibold mb-2 text-gray-700">Detalhes do Cliente</h5>
                                <dl className="space-y-1">
                                  <div>
                                    <dt className="inline font-medium text-gray-500">Nome: </dt>
                                    <dd className="inline text-gray-800">{order.customer_name}</dd>
                                  </div>
                                  <div>
                                    <dt className="inline font-medium text-gray-500">Email: </dt>
                                    <dd className="inline text-gray-800">{order.customer_email}</dd>
                                  </div>
                                  {/* Adicione outros detalhes do cliente aqui, se disponíveis, ex: telefone */}
                                </dl>
                              </div>

                              {/* Seção 2: Detalhes do Pagamento */}
                              <div className="p-3 bg-white rounded shadow">
                                <h5 className="font-semibold mb-2 text-gray-700">Detalhes do Pagamento</h5>
                                <dl className="space-y-1">
                                  <div>
                                    <dt className="inline font-medium text-gray-500">Valor: </dt>
                                    <dd className="inline text-gray-800">
                                      {order.amount != null ? formatCurrency(order.amount) : '—'}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="inline font-medium text-gray-500">Status: </dt>
                                    <dd className="inline text-gray-800">
                                      {order.payment_status ? (order.payment_status === 'paid' ? 'Confirmado' : order.payment_status) : '—'}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="inline font-medium text-gray-500">ID da Transação: </dt>
                                    <dd className="inline text-gray-800">{order.payment_id ?? '—'}</dd>
                                  </div>
                                  {/* NOVO: Status do endereço e email */}
                                  <div>
                                    <dt className="inline font-medium text-gray-500">Endereço: </dt>
                                    <dd className="inline">
                                      {order.has_shipping_address ? (
                                        <span className="text-green-600 font-medium">✅ Possui endereço</span>
                                      ) : (
                                        <span className="text-red-600 font-medium">❌ Sem endereço</span>
                                      )}
                                    </dd>
                                  </div>
                                  <div>
                                    <dt className="inline font-medium text-gray-500">Email: </dt>
                                    <dd className="inline">
                                      {order.email_sent ? (
                                        <span className="text-blue-600 font-medium">
                                          ✅ Enviado {order.email_sent_at ? format(new Date(order.email_sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : ''}
                                        </span>
                                      ) : (
                                        <span className="text-yellow-600 font-medium">⏳ Pendente</span>
                                      )}
                                    </dd>
                                  </div>
                                </dl>
                              </div>

                              {/* Seção 3: Fluxo de Status (Placeholder) */}
                              <div className="p-3 bg-white rounded shadow">
                                <h5 className="font-semibold mb-2 text-gray-700">Fluxo de Status</h5>
                                <p className="text-gray-600">
                                  Histórico de status do pedido aparecerá aqui.
                                  {/* Placeholder - a implementação real exigiria a busca do histórico de status */}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                  (Veja o histórico completo na página de detalhes do pedido)
                                </p>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>

            <footer className="flex items-center justify-between px-4 py-3 border-t">
              <div className="flex items-center text-sm text-gray-600">
                {isFetching && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Exibindo {(page - 1) * pageSize + 1}–
                {Math.min(page * pageSize, ordersData?.count || 0)} de {ordersData?.count || 0}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  Próxima
                </Button>
              </div>
            </footer>
          </>
        )}
      </Card>

      {/* Modal de Novo Pedido */}
      <NewOrderModal
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSuccess={() => {
          // Atualizar lista de pedidos
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          setShowNewOrderModal(false);
        }}
      />
    </div>
  );
}