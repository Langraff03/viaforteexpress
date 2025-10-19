import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package, ExternalLink, Search } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { Card } from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Loader2 } from 'lucide-react';

interface Order {
  id: string;
  tracking_code: string;
  status: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  // Campos adicionais para depuração
  client_id?: string;
  gateway_id?: string;
  user_id?: string;
  payment_id?: string;
  payment_status?: string;
}

const TrackingCodesDebug = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    fetchOrders();
    fetchDebugInfo();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.tracking_code?.toLowerCase().includes(searchLower) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_email?.toLowerCase().includes(searchLower)
    );
  });

  const fetchDebugInfo = async () => {
    try {
      // Verificar a estrutura da tabela orders
      const { data: columns, error: columnsError } = await supabase.rpc('pg_execute', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'orders'
          ORDER BY ordinal_position;
        `
      });

      // Verificar se há registros na tabela orders
      const { data: countData, error: countError } = await supabase.rpc('pg_execute', {
        query: `SELECT COUNT(*) FROM orders;`
      });

      // Verificar se há registros com client_id e gateway_id NULL
      const { data: nullData, error: nullError } = await supabase.rpc('pg_execute', {
        query: `
          SELECT 
            COUNT(*) as total,
            COUNT(client_id) as with_client_id,
            COUNT(gateway_id) as with_gateway_id
          FROM orders;
        `
      });

      setDebugInfo({
        columns: columns || [],
        count: countData?.[0]?.count || 0,
        nullInfo: nullData?.[0] || {},
        errors: {
          columns: columnsError,
          count: countError,
          null: nullError
        }
      });
    } catch (err) {
      console.error('Erro ao buscar informações de depuração:', err);
    }
  };

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

      console.log(`Encontrados ${data?.length || 0} pedidos:`, data);
      setOrders(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err);
      setError(err.message || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="w-8 h-8 mr-3" />
            Códigos de Rastreio (Modo Depuração)
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Acompanhe todos os códigos de rastreio gerados automaticamente quando um pagamento é confirmado
          </p>
        </div>
      </div>

      {/* Seção de Depuração */}
      <Card className="p-4">
        <h2 className="text-xl font-bold mb-4">Informações de Depuração</h2>
        
        <div className="mb-4">
          <h3 className="font-semibold">Estrutura da Tabela Orders:</h3>
          {debugInfo.errors?.columns ? (
            <Alert variant="error" className="mt-2">
              Erro ao buscar estrutura: {debugInfo.errors.columns.message}
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">Coluna</th>
                    <th className="px-4 py-2 border">Tipo</th>
                    <th className="px-4 py-2 border">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {debugInfo.columns?.map((col: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="px-4 py-2 border">{col.column_name}</td>
                      <td className="px-4 py-2 border">{col.data_type}</td>
                      <td className="px-4 py-2 border">{col.is_nullable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="font-semibold">Contagem de Registros:</h3>
          {debugInfo.errors?.count ? (
            <Alert variant="error" className="mt-2">
              Erro ao contar registros: {debugInfo.errors.count.message}
            </Alert>
          ) : (
            <p className="mt-2">Total de registros na tabela orders: <strong>{debugInfo.count}</strong></p>
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="font-semibold">Informações de Campos NULL:</h3>
          {debugInfo.errors?.null ? (
            <Alert variant="error" className="mt-2">
              Erro ao verificar campos NULL: {debugInfo.errors.null.message}
            </Alert>
          ) : (
            <div className="mt-2">
              <p>Total de registros: <strong>{debugInfo.nullInfo.total}</strong></p>
              <p>Registros com client_id: <strong>{debugInfo.nullInfo.with_client_id}</strong></p>
              <p>Registros com gateway_id: <strong>{debugInfo.nullInfo.with_gateway_id}</strong></p>
            </div>
          )}
        </div>
      </Card>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Buscar por código, nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        ) : error ? (
          <Alert variant="error" className="m-4">
            {error}
          </Alert>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Gateway ID</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Package className="w-5 h-5 mr-2 text-indigo-500" />
                        <span className="font-medium">{order.tracking_code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.customer_name}</span>
                        <span className="text-sm text-gray-500">{order.customer_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <span className={order.client_id ? "text-green-600" : "text-red-600"}>
                        {order.client_id || "NULL"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={order.gateway_id ? "text-green-600" : "text-red-600"}>
                        {order.gateway_id || "NULL"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<ExternalLink className="w-4 h-4" />}
                          onClick={() => window.open(`/tracking/${order.tracking_code}`, '_blank')}
                        >
                          Ver Rastreio
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TrackingCodesDebug;