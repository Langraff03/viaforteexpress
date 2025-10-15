import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Globe, 
  Mail,
  Shield,
  AlertTriangle,
  Save,
  X,
  TestTube,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { validateResendApiKey, getAvailableEmailDomains } from '../lib/emailService-frontend'; // ✅ Frontend seguro
import type { EmailDomain, CreateEmailDomainRequest, UpdateEmailDomainRequest, ValidationResponse } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

interface EmailDomainsPageProps {}

interface DomainFormData {
  domain_name: string;
  from_name: string;
  from_email: string;
  reply_to_email: string;
  resend_api_key: string;
  is_active: boolean;
}

const initialFormData: DomainFormData = {
  domain_name: '',
  from_name: '',
  from_email: '',
  reply_to_email: '',
  resend_api_key: '',
  is_active: true,
};

export default function EmailDomains({}: EmailDomainsPageProps) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDomain, setEditingDomain] = useState<EmailDomain | null>(null);
  const [formData, setFormData] = useState<DomainFormData>(initialFormData);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
  const [isValidating, setIsValidating] = useState(false);

  // Query para buscar domínios
  const { 
    data: domains, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['emailDomains'],
    queryFn: getAvailableEmailDomains,
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  // Mutation para criar domínio
  const createDomainMutation = useMutation({
    mutationFn: async (data: CreateEmailDomainRequest) => {
      const { data: result, error } = await supabase
        .from('email_domains')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailDomains'] });
      setShowAddForm(false);
      setFormData(initialFormData);
      setValidationResult(null);
    },
  });

  // Mutation para atualizar domínio
  const updateDomainMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UpdateEmailDomainRequest }) => {
      const { data: result, error } = await supabase
        .from('email_domains')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailDomains'] });
      setEditingDomain(null);
      setFormData(initialFormData);
      setValidationResult(null);
    },
  });

  // Mutation para deletar domínio
  const deleteDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_domains')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailDomains'] });
    },
  });

  // Mutation para ativar/desativar domínio
  const toggleDomainMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase
        .from('email_domains')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailDomains'] });
    },
  });

  const handleValidateApiKey = async () => {
    if (!formData.resend_api_key) {
      setValidationResult({
        valid: false,
        error: 'API key é obrigatória'
      });
      return;
    }

    setIsValidating(true);
    try {
      const result = await validateResendApiKey(formData.resend_api_key);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        error: 'Erro ao validar API key'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = () => {
    if (editingDomain) {
      updateDomainMutation.mutate({
        id: editingDomain.id,
        data: formData
      });
    } else {
      createDomainMutation.mutate(formData);
    }
  };

  const handleEdit = (domain: EmailDomain) => {
    setEditingDomain(domain);
    setFormData({
      domain_name: domain.domain_name,
      from_name: domain.from_name,
      from_email: domain.from_email,
      reply_to_email: domain.reply_to_email,
      resend_api_key: domain.resend_api_key,
      is_active: domain.is_active,
    });
    setShowAddForm(false);
    setValidationResult(null);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingDomain(null);
    setFormData(initialFormData);
    setValidationResult(null);
  };

  const handleDelete = (domain: EmailDomain) => {
    if (domain.is_default) {
      alert('Não é possível excluir o domínio padrão!');
      return;
    }
    
    if (confirm(`Tem certeza que deseja excluir o domínio "${domain.domain_name}"?`)) {
      deleteDomainMutation.mutate(domain.id);
    }
  };

  const toggleApiKeyVisibility = (domainId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [domainId]: !prev[domainId]
    }));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="mx-auto mb-4 w-12 h-12" />
              <p>Erro ao carregar domínios: {error instanceof Error ? error.message : 'Erro desconhecido'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Globe className="w-8 h-8 text-indigo-600" />
            Domínios de Email
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie domínios personalizados para campanhas de email
          </p>
        </div>
        
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Domínio
        </Button>
      </div>

      {/* Lista de Domínios */}
      <div className="grid gap-4">
        {domains?.map((domain: EmailDomain) => (
          <Card key={domain.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {domain.domain_name}
                    </h3>
                    
                    <div className="flex gap-2">
                      {domain.is_default && (
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Padrão
                        </Badge>
                      )}
                      <Badge
                        variant={domain.is_active ? "success" : "default"}
                        className={domain.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {domain.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Remetente:</span> {domain.from_name} {'<'}{domain.from_email}{'>'}</p>
                    <p><span className="font-medium">Resposta:</span> {domain.reply_to_email}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">API Key:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {showApiKey[domain.id] 
                          ? domain.resend_api_key 
                          : '*'.repeat(domain.resend_api_key.length)
                        }
                      </code>
                      <button
                        onClick={() => toggleApiKeyVisibility(domain.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey[domain.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Criado em {new Date(domain.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!domain.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleDomainMutation.mutate({ 
                        id: domain.id, 
                        is_active: !domain.is_active 
                      })}
                      disabled={toggleDomainMutation.isPending}
                    >
                      {domain.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(domain)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  {!domain.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(domain)}
                      className="text-red-600 hover:text-red-800"
                      disabled={deleteDomainMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {domains?.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Mail className="mx-auto mb-4 w-12 h-12 text-gray-400" />
              <p className="text-gray-600">Nenhum domínio configurado ainda.</p>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="mt-4"
              >
                Adicionar Primeiro Domínio
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formulário de Adicionar/Editar */}
      {(showAddForm || editingDomain) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
              {editingDomain ? 'Editar Domínio' : 'Adicionar Novo Domínio'}
            </h3>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Domínio *
                </label>
                <Input
                  type="text"
                  placeholder="exemplo: farmacia-express.com"
                  value={formData.domain_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain_name: e.target.value }))}
                  disabled={!!editingDomain} // Não permite editar o nome do domínio
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Remetente *
                </label>
                <Input
                  type="text"
                  placeholder="exemplo: Farmácia Express"
                  value={formData.from_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, from_name: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email do Remetente *
                </label>
                <Input
                  type="email"
                  placeholder="exemplo: contato@farmacia-express.com"
                  value={formData.from_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, from_email: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email de Resposta *
                </label>
                <Input
                  type="email"
                  placeholder="exemplo: suporte@farmacia-express.com"
                  value={formData.reply_to_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, reply_to_email: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key do Resend *
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="re_xxxxxxxxxxxxxxxxx"
                  value={formData.resend_api_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, resend_api_key: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleValidateApiKey}
                  disabled={!formData.resend_api_key || isValidating}
                  className="flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  {isValidating ? 'Validando...' : 'Validar'}
                </Button>
              </div>
              
              {validationResult && (
                <div className={`mt-2 p-3 rounded ${
                  validationResult.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {validationResult.valid ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {validationResult.valid ? 'API key válida!' : validationResult.error}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Domínio ativo
              </label>
            </div>
            
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.domain_name || 
                  !formData.from_name || 
                  !formData.from_email || 
                  !formData.reply_to_email || 
                  !formData.resend_api_key ||
                  createDomainMutation.isPending ||
                  updateDomainMutation.isPending
                }
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingDomain ? 'Atualizar' : 'Criar'} Domínio
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
            
            {(createDomainMutation.error || updateDomainMutation.error) && (
              <div className="p-3 bg-red-50 text-red-700 rounded">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">
                    Erro ao salvar: {
                      createDomainMutation.error?.message || 
                      updateDomainMutation.error?.message
                    }
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações Importantes */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-blue-900">
            ℹ️ Informações Importantes
          </h3>
        </CardHeader>
        <CardContent className="p-6 space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p>
              <span className="font-medium">Domínio Padrão:</span> O domínio padrão (viaforteexpress.com) é usado para 
              emails de rastreio e não pode ser desativado ou removido.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p>
              <span className="font-medium">Domínios Personalizados:</span> Podem ser usados apenas para campanhas 
              de ofertas a leads. Configure diferentes domínios para diferentes tipos de negócio.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <TestTube className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <p>
              <span className="font-medium">Validação de API Key:</span> Sempre valide sua API key do Resend 
              antes de salvar. Domínios com API keys inválidas podem causar falhas nas campanhas.
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">Verificação de Domínio no Resend</p>
                <p className="text-yellow-700 mt-1">
                  Certifique-se de que o domínio está verificado no painel do Resend antes de usá-lo 
                  em campanhas de produção.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}