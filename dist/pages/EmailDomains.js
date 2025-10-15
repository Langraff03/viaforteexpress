import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Globe, Mail, Shield, AlertTriangle, Save, X, TestTube, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; // ✅ SEGURO: ANON_KEY + RLS
import { validateResendApiKey, getAvailableEmailDomains } from '../lib/emailService-frontend'; // ✅ Frontend seguro
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
const initialFormData = {
    domain_name: '',
    from_name: '',
    from_email: '',
    reply_to_email: '',
    resend_api_key: '',
    is_active: true,
};
export default function EmailDomains({}) {
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingDomain, setEditingDomain] = useState(null);
    const [formData, setFormData] = useState(initialFormData);
    const [validationResult, setValidationResult] = useState(null);
    const [showApiKey, setShowApiKey] = useState({});
    const [isValidating, setIsValidating] = useState(false);
    // Query para buscar domínios
    const { data: domains, isLoading, error } = useQuery({
        queryKey: ['emailDomains'],
        queryFn: getAvailableEmailDomains,
        refetchInterval: 30000, // Atualizar a cada 30s
    });
    // Mutation para criar domínio
    const createDomainMutation = useMutation({
        mutationFn: async (data) => {
            const { data: result, error } = await supabase
                .from('email_domains')
                .insert([data])
                .select()
                .single();
            if (error)
                throw error;
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
        mutationFn: async ({ id, data }) => {
            const { data: result, error } = await supabase
                .from('email_domains')
                .update(data)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
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
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('email_domains')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['emailDomains'] });
        },
    });
    // Mutation para ativar/desativar domínio
    const toggleDomainMutation = useMutation({
        mutationFn: async ({ id, is_active }) => {
            const { error } = await supabase
                .from('email_domains')
                .update({ is_active })
                .eq('id', id);
            if (error)
                throw error;
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
        }
        catch (error) {
            setValidationResult({
                valid: false,
                error: 'Erro ao validar API key'
            });
        }
        finally {
            setIsValidating(false);
        }
    };
    const handleSubmit = () => {
        if (editingDomain) {
            updateDomainMutation.mutate({
                id: editingDomain.id,
                data: formData
            });
        }
        else {
            createDomainMutation.mutate(formData);
        }
    };
    const handleEdit = (domain) => {
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
    const handleDelete = (domain) => {
        if (domain.is_default) {
            alert('Não é possível excluir o domínio padrão!');
            return;
        }
        if (confirm(`Tem certeza que deseja excluir o domínio "${domain.domain_name}"?`)) {
            deleteDomainMutation.mutate(domain.id);
        }
    };
    const toggleApiKeyVisibility = (domainId) => {
        setShowApiKey(prev => ({
            ...prev,
            [domainId]: !prev[domainId]
        }));
    };
    if (isLoading) {
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "animate-pulse space-y-6", children: [_jsx("div", { className: "h-8 bg-gray-200 rounded w-1/3" }), _jsx("div", { className: "grid gap-4", children: [1, 2, 3].map(i => (_jsx("div", { className: "h-32 bg-gray-200 rounded" }, i))) })] }) }));
    }
    if (error) {
        return (_jsx("div", { className: "p-6", children: _jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "text-center text-red-600", children: [_jsx(AlertTriangle, { className: "mx-auto mb-4 w-12 h-12" }), _jsxs("p", { children: ["Erro ao carregar dom\u00EDnios: ", error instanceof Error ? error.message : 'Erro desconhecido'] })] }) }) }) }));
    }
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 flex items-center gap-3", children: [_jsx(Globe, { className: "w-8 h-8 text-indigo-600" }), "Dom\u00EDnios de Email"] }), _jsx("p", { className: "text-gray-600 mt-2", children: "Gerencie dom\u00EDnios personalizados para campanhas de email" })] }), _jsxs(Button, { onClick: () => setShowAddForm(true), className: "flex items-center gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), "Adicionar Dom\u00EDnio"] })] }), _jsxs("div", { className: "grid gap-4", children: [domains?.map((domain) => (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: domain.domain_name }), _jsxs("div", { className: "flex gap-2", children: [domain.is_default && (_jsxs(Badge, { variant: "default", className: "bg-blue-100 text-blue-800", children: [_jsx(Shield, { className: "w-3 h-3 mr-1" }), "Padr\u00E3o"] })), _jsx(Badge, { variant: domain.is_active ? "success" : "default", className: domain.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800', children: domain.is_active ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-3 h-3 mr-1" }), "Ativo"] })) : (_jsxs(_Fragment, { children: [_jsx(XCircle, { className: "w-3 h-3 mr-1" }), "Inativo"] })) })] })] }), _jsxs("div", { className: "space-y-2 text-sm text-gray-600", children: [_jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Remetente:" }), " ", domain.from_name, " ", '<', domain.from_email, '>'] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Resposta:" }), " ", domain.reply_to_email] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium", children: "API Key:" }), _jsx("code", { className: "bg-gray-100 px-2 py-1 rounded text-xs", children: showApiKey[domain.id]
                                                                    ? domain.resend_api_key
                                                                    : '*'.repeat(domain.resend_api_key.length) }), _jsx("button", { onClick: () => toggleApiKeyVisibility(domain.id), className: "text-gray-400 hover:text-gray-600", children: showApiKey[domain.id] ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Criado em ", new Date(domain.created_at).toLocaleDateString('pt-BR')] })] })] }), _jsxs("div", { className: "flex gap-2", children: [!domain.is_default && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => toggleDomainMutation.mutate({
                                                    id: domain.id,
                                                    is_active: !domain.is_active
                                                }), disabled: toggleDomainMutation.isPending, children: domain.is_active ? 'Desativar' : 'Ativar' })), _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleEdit(domain), children: _jsx(Edit, { className: "w-4 h-4" }) }), !domain.is_default && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => handleDelete(domain), className: "text-red-600 hover:text-red-800", disabled: deleteDomainMutation.isPending, children: _jsx(Trash2, { className: "w-4 h-4" }) }))] })] }) }) }, domain.id))), domains?.length === 0 && (_jsx(Card, { children: _jsxs(CardContent, { className: "p-12 text-center", children: [_jsx(Mail, { className: "mx-auto mb-4 w-12 h-12 text-gray-400" }), _jsx("p", { className: "text-gray-600", children: "Nenhum dom\u00EDnio configurado ainda." }), _jsx(Button, { onClick: () => setShowAddForm(true), className: "mt-4", children: "Adicionar Primeiro Dom\u00EDnio" })] }) }))] }), (showAddForm || editingDomain) && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h3", { className: "text-lg font-semibold", children: editingDomain ? 'Editar Domínio' : 'Adicionar Novo Domínio' }) }), _jsxs(CardContent, { className: "p-6 space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nome do Dom\u00EDnio *" }), _jsx(Input, { type: "text", placeholder: "exemplo: farmacia-express.com", value: formData.domain_name, onChange: (e) => setFormData(prev => ({ ...prev, domain_name: e.target.value })), disabled: !!editingDomain })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Nome do Remetente *" }), _jsx(Input, { type: "text", placeholder: "exemplo: Farm\u00E1cia Express", value: formData.from_name, onChange: (e) => setFormData(prev => ({ ...prev, from_name: e.target.value })) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email do Remetente *" }), _jsx(Input, { type: "email", placeholder: "exemplo: contato@farmacia-express.com", value: formData.from_email, onChange: (e) => setFormData(prev => ({ ...prev, from_email: e.target.value })) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email de Resposta *" }), _jsx(Input, { type: "email", placeholder: "exemplo: suporte@farmacia-express.com", value: formData.reply_to_email, onChange: (e) => setFormData(prev => ({ ...prev, reply_to_email: e.target.value })) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "API Key do Resend *" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "password", placeholder: "re_xxxxxxxxxxxxxxxxx", value: formData.resend_api_key, onChange: (e) => setFormData(prev => ({ ...prev, resend_api_key: e.target.value })), className: "flex-1" }), _jsxs(Button, { variant: "outline", onClick: handleValidateApiKey, disabled: !formData.resend_api_key || isValidating, className: "flex items-center gap-2", children: [_jsx(TestTube, { className: "w-4 h-4" }), isValidating ? 'Validando...' : 'Validar'] })] }), validationResult && (_jsx("div", { className: `mt-2 p-3 rounded ${validationResult.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`, children: _jsxs("div", { className: "flex items-center gap-2", children: [validationResult.valid ? (_jsx(CheckCircle, { className: "w-4 h-4" })) : (_jsx(XCircle, { className: "w-4 h-4" })), _jsx("span", { className: "text-sm", children: validationResult.valid ? 'API key válida!' : validationResult.error })] }) }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "is_active", checked: formData.is_active, onChange: (e) => setFormData(prev => ({ ...prev, is_active: e.target.checked })), className: "rounded" }), _jsx("label", { htmlFor: "is_active", className: "text-sm text-gray-700", children: "Dom\u00EDnio ativo" })] }), _jsxs("div", { className: "flex gap-3 pt-4 border-t", children: [_jsxs(Button, { onClick: handleSubmit, disabled: !formData.domain_name ||
                                            !formData.from_name ||
                                            !formData.from_email ||
                                            !formData.reply_to_email ||
                                            !formData.resend_api_key ||
                                            createDomainMutation.isPending ||
                                            updateDomainMutation.isPending, className: "flex items-center gap-2", children: [_jsx(Save, { className: "w-4 h-4" }), editingDomain ? 'Atualizar' : 'Criar', " Dom\u00EDnio"] }), _jsxs(Button, { variant: "outline", onClick: handleCancel, children: [_jsx(X, { className: "w-4 h-4 mr-2" }), "Cancelar"] })] }), (createDomainMutation.error || updateDomainMutation.error) && (_jsx("div", { className: "p-3 bg-red-50 text-red-700 rounded", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4" }), _jsxs("span", { className: "text-sm", children: ["Erro ao salvar: ", createDomainMutation.error?.message ||
                                                    updateDomainMutation.error?.message] })] }) }))] })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx("h3", { className: "text-lg font-semibold text-blue-900", children: "\u2139\uFE0F Informa\u00E7\u00F5es Importantes" }) }), _jsxs(CardContent, { className: "p-6 space-y-3 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Shield, { className: "w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Dom\u00EDnio Padr\u00E3o:" }), " O dom\u00EDnio padr\u00E3o (viaforteexpress.com) \u00E9 usado para emails de rastreio e n\u00E3o pode ser desativado ou removido."] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Mail, { className: "w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Dom\u00EDnios Personalizados:" }), " Podem ser usados apenas para campanhas de ofertas a leads. Configure diferentes dom\u00EDnios para diferentes tipos de neg\u00F3cio."] })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(TestTube, { className: "w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Valida\u00E7\u00E3o de API Key:" }), " Sempre valide sua API key do Resend antes de salvar. Dom\u00EDnios com API keys inv\u00E1lidas podem causar falhas nas campanhas."] })] }), _jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded p-3", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-yellow-800", children: "Verifica\u00E7\u00E3o de Dom\u00EDnio no Resend" }), _jsx("p", { className: "text-yellow-700 mt-1", children: "Certifique-se de que o dom\u00EDnio est\u00E1 verificado no painel do Resend antes de us\u00E1-lo em campanhas de produ\u00E7\u00E3o." })] })] }) })] })] })] }));
}
