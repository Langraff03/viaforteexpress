import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  ExternalLink,
  AlertCircle,
  Filter,
  Search,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseAdmin } from '../../lib/server/supabaseAdmin';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import type { DomainRequest, DomainRequestStatus } from '../../types/checkout';

interface DomainRequestWithUser extends DomainRequest {
  user: {
    email: string;
    name?: string;
  };
}

interface DomainApprovalData {
  domain_name: string;
  from_name: string;
  from_email: string;
  reply_to_email: string;
  resend_api_key: string;
}

export default function DomainRequestsManagement() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<DomainRequestStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<DomainRequestWithUser | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState<DomainApprovalData>({
    domain_name: '',
    from_name: '',
    from_email: '',
    reply_to_email: '',
    resend_api_key: ''
  });
  const [adminNotes, setAdminNotes] = useState('');

  // Buscar solicitações de domínio
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['admin-domain-requests', selectedStatus, searchTerm],
    queryFn: async () => {
      let query = supabaseAdmin
        .from('domain_requests')
        .select(`
          *,
          user:user_id (
            email,
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Filtrar por status
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      // Filtrar por pesquisa
      if (searchTerm) {
        query = query.or(
          `domain_name.ilike.%${searchTerm}%,business_name.ilike.%${searchTerm}%,user.email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DomainRequestWithUser[];
    }
  });

  // Mutation para aprovar solicitação
  const approveMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      domainData 
    }: { 
      requestId: string; 
      domainData: DomainApprovalData 
    }) => {
      // 1. Criar domínio na tabela email_domains
      const { data: newDomain, error: domainError } = await supabaseAdmin
        .from('email_domains')
        .insert({
          domain_name: domainData.domain_name,
          from_name: domainData.from_name,
          from_email: domainData.from_email,
          reply_to_email: domainData.reply_to_email,
          resend_api_key: domainData.resend_api_key,
          is_active: true,
          is_default: false,
          owner_id: selectedRequest?.user_id
        })
        .select()
        .single();

      if (domainError) throw domainError;

      // 2. Atualizar solicitação para aprovada
      const { error: updateError } = await supabaseAdmin
        .from('domain_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
          approved_by: 'admin', // TODO: usar ID do admin logado
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      return newDomain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-domain-requests'] });
      setShowApprovalModal(false);
      setSelectedRequest(null);
      resetForm();
    }
  });

  // Mutation para rejeitar solicitação
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, notes }: { requestId: string; notes: string }) => {
      const { error } = await supabaseAdmin
        .from('domain_requests')
        .update({
          status: 'rejected',
          admin_notes: notes,
          approved_by: 'admin', // TODO: usar ID do admin logado
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-domain-requests'] });
      setSelectedRequest(null);
      setAdminNotes('');
    }
  });

  const resetForm = () => {
    setApprovalData({
      domain_name: '',
      from_name: '',
      from_email: '',
      reply_to_email: '',
      resend_api_key: ''
    });
    setAdminNotes('');
  };

  const handleApprove = (request: DomainRequestWithUser) => {
    setSelectedRequest(request);
    setApprovalData({
      domain_name: request.domain_name,
      from_name: request.business_name || '',
      from_email: `contato@${request.domain_name}`,
      reply_to_email: `suporte@${request.domain_name}`,
      resend_api_key: ''
    });
    setShowApprovalModal(true);
  };

  const handleReject = (request: DomainRequestWithUser) => {
    setSelectedRequest(request);
    setAdminNotes('');
  };

  const confirmApproval = () => {
    if (!selectedRequest) return;
    
    approveMutation.mutate({
      requestId: selectedRequest.id,
      domainData: approvalData
    });
  };

  const confirmRejection = () => {
    if (!selectedRequest) return;
    
    rejectMutation.mutate({
      requestId: selectedRequest.id,
      notes: adminNotes
    });
  };

  const getStatusBadge = (status: DomainRequestStatus) => {
    const configs = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        text: 'Pendente'
      },
      approved: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        text: 'Aprovado'
      },
      rejected: {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        text: 'Rejeitado'
      }
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const filteredRequests = requests?.filter((request: DomainRequestWithUser) => {
    if (selectedStatus !== 'all' && request.status !== selectedStatus) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.domain_name.toLowerCase().includes(searchLower) ||
        request.business_name?.toLowerCase().includes(searchLower) ||
        request.user.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-emerald-600">Carregando solicitações...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar solicitações</h3>
          <p className="text-gray-500">Tente novamente em alguns instantes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Domínios de Email</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie solicitações de domínios personalizados dos freelancers
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        {[
          { status: 'all', label: 'Total', count: requests?.length || 0, color: 'bg-blue-500' },
          { status: 'pending', label: 'Pendentes', count: requests?.filter((r: DomainRequestWithUser) => r.status === 'pending').length || 0, color: 'bg-yellow-500' },
          { status: 'approved', label: 'Aprovados', count: requests?.filter((r: DomainRequestWithUser) => r.status === 'approved').length || 0, color: 'bg-green-500' },
          { status: 'rejected', label: 'Rejeitados', count: requests?.filter((r: DomainRequestWithUser) => r.status === 'rejected').length || 0, color: 'bg-red-500' }
        ].map((stat) => (
          <div key={stat.status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedStatus(stat.status as DomainRequestStatus | 'all')}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {stat.count}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por domínio, empresa ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Filtro de Status */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as DomainRequestStatus | 'all')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Solicitações */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            Solicitações de Domínio ({filteredRequests.length})
          </h2>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma solicitação encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                Não há solicitações que correspondam aos filtros atuais.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request: DomainRequestWithUser) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {request.domain_name}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          {request.user.email}
                        </div>

                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>

                        {request.business_name && (
                          <div className="flex items-center text-gray-600">
                            <Globe className="w-4 h-4 mr-2" />
                            {request.business_name}
                          </div>
                        )}

                        {request.admin_notes && (
                          <div className="flex items-start text-gray-600">
                            <MessageSquare className="w-4 h-4 mr-2 mt-0.5" />
                            <span className="text-xs">{request.admin_notes}</span>
                          </div>
                        )}
                      </div>

                      {request.reason && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">
                            <strong>Motivo:</strong> {request.reason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    {request.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(request)}
                          disabled={approveMutation.isPending}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </button>
                        
                        <button
                          onClick={() => handleReject(request)}
                          disabled={rejectMutation.isPending}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Aprovação */}
      <AnimatePresence>
        {showApprovalModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-lg mx-4"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Aprovar Domínio: {selectedRequest.domain_name}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Remetente *
                  </label>
                  <input
                    type="text"
                    value={approvalData.from_name}
                    onChange={(e) => setApprovalData((prev: DomainApprovalData) => ({ ...prev, from_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                    placeholder="Nome da Empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email do Remetente *
                  </label>
                  <input
                    type="email"
                    value={approvalData.from_email}
                    onChange={(e) => setApprovalData((prev: DomainApprovalData) => ({ ...prev, from_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                    placeholder={`contato@${selectedRequest.domain_name}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de Resposta *
                  </label>
                  <input
                    type="email"
                    value={approvalData.reply_to_email}
                    onChange={(e) => setApprovalData((prev: DomainApprovalData) => ({ ...prev, reply_to_email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                    placeholder={`suporte@${selectedRequest.domain_name}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resend API Key *
                  </label>
                  <input
                    type="password"
                    value={approvalData.resend_api_key}
                    onChange={(e) => setApprovalData((prev: DomainApprovalData) => ({ ...prev, resend_api_key: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                    placeholder="re_..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas Administrativas
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                    placeholder="Notas para o freelancer..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmApproval}
                  disabled={approveMutation.isPending || !approvalData.from_name || !approvalData.from_email || !approvalData.resend_api_key}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {approveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />}
                  Aprovar Domínio
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Rejeição */}
      <AnimatePresence>
        {selectedRequest && selectedRequest.status === 'pending' && !showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Rejeitar Domínio: {selectedRequest.domain_name}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da Rejeição *
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                  placeholder="Explique o motivo da rejeição..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRejection}
                  disabled={rejectMutation.isPending || !adminNotes.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />}
                  Rejeitar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}