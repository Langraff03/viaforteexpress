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
}

const TrackingCodes = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.tracking_code.toLowerCase().includes(searchLower) ||
      order.customer_name.toLowerCase().includes(searchLower) ||
      order.customer_email.toLowerCase().includes(searchLower)
    );
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
            Códigos de Rastreio
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Acompanhe todos os códigos de rastreio gerados automaticamente quando um pagamento é confirmado
          </p>
        </div>
      </div>

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

export default TrackingCodes;