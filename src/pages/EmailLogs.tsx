import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, RefreshCw, Mail, AlertCircle, CheckCircle, ExternalLink, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { OfferEmailLog } from '../types';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Alert from '../components/ui/Alert';

const EmailLogs = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
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

  const filteredLogs = (emailLogs as OfferEmailLog[]).filter(log => {
    const matchesSearch = log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.lead_id && log.lead_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    const colors = {
      sent: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    return status === 'sent' ? (
      <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-500" />
    ) : (
      <AlertCircle className="w-4 h-4 mr-1.5 text-red-500" />
    );
  };

  const getStatusText = (status: string) => {
    return status === 'sent' ? 'Enviado' : 'Falhou';
  };

  const getOriginText = (origin: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center bg-gradient-to-r from-indigo-500 to-indigo-600 p-8 rounded-xl shadow-lg mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Mail className="w-8 h-8 mr-3 text-white" />
            Logs de Email
          </h1>
          <p className="mt-3 text-lg text-indigo-100">
            Acompanhe todas as notificações enviadas aos clientes
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<RefreshCw className="h-5 w-5" />}
          isLoading={isRetrying}
          onClick={handleRetryFailed}
          className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-md transition-all duration-200 font-semibold px-6 py-3"
        >
          Reenviar Emails com Falha
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-xl shadow-md mb-8">
        <div className="md:col-span-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base transition-all duration-200"
              placeholder="Buscar logs de email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="sent">Enviados</option>
              <option value="failed">Falhas</option>
            </select>
          </div>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg bg-white text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="sent">Enviados</option>
              <option value="failed">Falhas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerta de erro */}
      {filteredLogs.some(log => log.status === 'failed') && (
        <Alert variant="warning" className="mb-8 shadow-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Existem emails que falharam no envio. Use o botão "Reenviar Emails com Falha".</span>
          </div>
        </Alert>
      )}

      {/* Tabela */}
      <Card className="shadow-xl rounded-xl overflow-hidden border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200">
              <TableHead>ID do Lead</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Destinatário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Envio</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.map((log) => (
              <TableRow key={log.id} className="hover:bg-gray-50 transition-colors">
                <TableCell>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-indigo-500" />
                    <span className="font-medium text-indigo-600 tracking-wider">{log.lead_id || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>{getOriginText(log.origin)}</TableCell>
                <TableCell>{log.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(log.status)}`}>
                    {getStatusIcon(log.status)}
                    {getStatusText(log.status)}
                  </span>
                </TableCell>
                <TableCell>
                  {format(new Date(log.sent_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <span className="text-gray-400">-</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Paginação NOVA aqui */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
            <div className="text-sm text-gray-500 mb-2 md:mb-0">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredLogs.length)} de {filteredLogs.length} registros
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              {currentPage > 2 && (
                <button
                  className="px-3 py-1 rounded text-sm hover:bg-gray-100"
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </button>
              )}
              {currentPage > 3 && (
                <span className="px-2 text-gray-400">...</span>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === currentPage ||
                  page === currentPage - 1 ||
                  page === currentPage + 1
                )
                .map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded text-sm font-semibold ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}

              {currentPage < totalPages - 2 && (
                <span className="px-2 text-gray-400">...</span>
              )}
              {currentPage < totalPages - 1 && (
                <button
                  className="px-3 py-1 rounded text-sm hover:bg-gray-100"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmailLogs;
