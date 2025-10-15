import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Settings, Send, CheckCircle, ArrowLeft, ArrowRight, AlertCircle, Zap, Users, Eye, BookOpen, Shield, Save, RefreshCw, Sparkles, Mail } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import CampaignProgressTracker from '../components/CampaignProgressTracker';
import EmailPreviewModal from '../components/ui/EmailPreviewModal';
import CampaignSuccessModal from '../components/ui/CampaignSuccessModal';
import TemplateGuide from '../components/ui/TemplateGuide';
import FileUpload from '../components/ui/FileUpload';
import TemplateSelector from '../components/ui/TemplateSelector';
import DeliverabilityGuide from '../components/ui/DeliverabilityGuide';
import SubjectOptimizer from '../components/ui/SubjectOptimizer';
import DeliverabilityTips from '../components/ui/DeliverabilityTips';
import { validateEmailTemplate } from '../lib/templateValidator';
import { getAvailableEmailDomains } from '../lib/emailService-frontend'; // ✅ Frontend seguro
import { useAutoSave } from '../hooks/useAutoSave';
import { useValidation } from '../hooks/useValidation';
const DisparoEmMassa = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(1);
    const [campaignData, setCampaignData] = useState({
        leads: [],
        offerConfig: {
            name: '',
            discount: '',
            link: '',
            description: ''
        },
        emailTemplate: '',
        emailSubject: '', // ✅ NOVO: Assunto totalmente configurável
        templateVariables: {},
        selectedDomain: '' // ✅ NOVO: Estado para domínio selecionado
    });
    const [errors, setErrors] = useState([]);
    // ✅ NOVO: Query para carregar domínios disponíveis
    const { data: availableDomains = [], isLoading: domainsLoading } = useQuery({
        queryKey: ['availableEmailDomains'],
        queryFn: getAvailableEmailDomains,
        refetchInterval: 60000, // Atualizar a cada 60s
    });
    // ✅ NOVO: Sistema de Auto-save
    const { isSaving: autoSaving, lastSaved, hasUnsavedChanges, error: autoSaveError, saveNow, clearData: clearAutoSave } = useAutoSave(campaignData, {
        key: 'campaign-draft',
        delay: 3000, // Salvar a cada 3 segundos
        onSave: (data) => {
            console.log('💾 Campanha salva automaticamente:', data);
        },
        onError: (error) => {
            console.error('❌ Erro no auto-save:', error);
            setErrors([`Erro ao salvar automaticamente: ${error.message}`]);
        }
    });
    // ✅ NOVO: Sistema de Validação em Tempo Real
    const validationRules = [
        {
            field: 'name',
            validator: (value) => value.trim().length >= 3,
            message: 'Nome deve ter pelo menos 3 caracteres',
            required: true
        },
        {
            field: 'discount',
            validator: (value) => value.trim().length > 0,
            message: 'Desconto é obrigatório',
            required: true
        },
        {
            field: 'link',
            validator: (value) => {
                if (!value)
                    return false;
                try {
                    new URL(value);
                    return true;
                }
                catch {
                    return false;
                }
            },
            message: 'Link deve ser uma URL válida',
            required: true
        },
        {
            field: 'description',
            validator: (value) => value.trim().length >= 10,
            message: 'Descrição deve ter pelo menos 10 caracteres',
            required: true
        }
    ];
    const { isValid: formValid, errors: validationErrors, warnings: validationWarnings, suggestions: validationSuggestions, markFieldAsTouched, getFieldError, getFieldWarning, getFieldSuggestion, resetValidation } = useValidation({
        name: campaignData.offerConfig.name,
        discount: campaignData.offerConfig.discount,
        link: campaignData.offerConfig.link,
        description: campaignData.offerConfig.description
    }, validationRules, { debounceMs: 500 });
    // Sistema híbrido: detecta campanhas grandes automaticamente
    const [isLargeCampaign, setIsLargeCampaign] = useState(false);
    const [activeCampaignId, setActiveCampaignId] = useState(null);
    const [campaignMode, setCampaignMode] = useState('detecting');
    // Estados para os modais
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [showCampaignSuccess, setShowCampaignSuccess] = useState(false);
    const [showTemplateGuide, setShowTemplateGuide] = useState(false);
    const [campaignStats, setCampaignStats] = useState(null);
    const [templateValidation, setTemplateValidation] = useState(null);
    // ✅ NOVO: Estados para templates e modo de edição
    const [usePredefinedTemplates, setUsePredefinedTemplates] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const LARGE_CAMPAIGN_THRESHOLD = 100; // Campanhas >100 leads usam sistema enterprise
    const steps = [
        { number: 1, title: 'Upload de Leads', icon: Upload, description: 'Faça upload do arquivo JSON com os leads' },
        { number: 2, title: 'Configurar Oferta', icon: Settings, description: 'Configure os detalhes da oferta' },
        { number: 3, title: 'Design do Template', icon: FileText, description: 'Personalize o template do email' },
        { number: 4, title: isLargeCampaign ? 'Monitorar Campanha' : 'Revisar e Disparar', icon: isLargeCampaign ? Zap : Send, description: isLargeCampaign ? 'Acompanhe o progresso em tempo real' : 'Revise e confirme o envio' }
    ];
    // Step 1: Upload e validação do arquivo
    const handleFileUpload = useCallback((file) => {
        if (file.type !== 'application/json') {
            setErrors(['Por favor, selecione um arquivo JSON válido.']);
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target?.result);
                // Validar estrutura dos leads
                if (!Array.isArray(jsonData)) {
                    setErrors(['O arquivo deve conter um array de leads.']);
                    return;
                }
                const validLeads = [];
                const validationErrors = [];
                jsonData.forEach((lead, index) => {
                    if (!lead.nome || !lead.email) {
                        validationErrors.push(`Lead ${index + 1}: Nome e email são obrigatórios.`);
                        return;
                    }
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
                        validationErrors.push(`Lead ${index + 1}: Email inválido (${lead.email}).`);
                        return;
                    }
                    validLeads.push(lead);
                });
                if (validationErrors.length > 0) {
                    setErrors(validationErrors.slice(0, 5)); // Mostrar apenas os primeiros 5 erros
                    return;
                }
                setCampaignData(prev => ({ ...prev, leads: validLeads }));
                setErrors([]);
                // 🎯 DETECÇÃO AUTOMÁTICA DE CAMPANHA GRANDE
                const isLarge = validLeads.length > LARGE_CAMPAIGN_THRESHOLD;
                setIsLargeCampaign(isLarge);
                setCampaignMode(isLarge ? 'large' : 'small');
                console.log(`📊 Campanha detectada: ${isLarge ? 'GRANDE' : 'PEQUENA'} (${validLeads.length} leads)`);
                console.log(`🔄 Modo ativo: ${isLarge ? 'Sistema Enterprise (massEmailQueue)' : 'Sistema Atual (emailQueue)'}`);
            }
            catch (error) {
                setErrors(['Erro ao ler o arquivo JSON. Verifique se o formato está correto.']);
            }
        };
        reader.readAsText(file);
    }, [LARGE_CAMPAIGN_THRESHOLD]);
    // Step 2: Configurar oferta
    const handleOfferConfigChange = (field, value) => {
        setCampaignData(prev => ({
            ...prev,
            offerConfig: { ...prev.offerConfig, [field]: value }
        }));
        markFieldAsTouched(field);
    };
    // ✅ NOVO: Handler para seleção de template
    const handleTemplateSelect = useCallback((template) => {
        setSelectedTemplate(template);
        setCampaignData(prev => ({
            ...prev,
            emailTemplate: template.html,
            emailSubject: template.subject || prev.emailSubject || '{{nome}}, confira nossa mensagem' // ✅ NOVO: Define o assunto do template
        }));
        console.log('🎨 Template selecionado:', template.name);
    }, []);
    // ✅ NOVO: Handler para mudança de modo de edição
    const handleEditModeChange = useCallback((useTemplates) => {
        setUsePredefinedTemplates(useTemplates);
        if (useTemplates && selectedTemplate) {
            setCampaignData(prev => ({
                ...prev,
                emailTemplate: selectedTemplate.html
            }));
        }
    }, [selectedTemplate]);
    // Step 3: Gerar template automaticamente
    const generateEmailTemplate = () => {
        const { name, discount, link, description } = campaignData.offerConfig;
        const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>{{oferta}}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cta-button { background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 {{oferta}}</h1>
            <p>Olá {{nome}}, temos uma oferta especial para você!</p>
          </div>
          
          <div class="content">
            <h2>💰 ${discount}</h2>
            <p>Esta é uma oferta especial exclusiva para você. Não perca esta oportunidade!</p>
            <p>${description}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{link}}" class="cta-button">Aproveitar Oferta Agora</a>
          </div>
          
          <div class="footer">
            <p>Obrigado por confiar em nossos serviços!</p>
            <p>Equipe Via Forte Express</p>
          </div>
        </div>
      </body>
      </html>
    `;
        setCampaignData(prev => ({
            ...prev,
            emailTemplate: template.trim()
        }));
    };
    // Função para gerar dados de exemplo para preview
    const getSampleData = () => {
        // Usar dados do primeiro lead se disponível, senão usar dados fictícios
        const firstLead = campaignData.leads[0];
        return {
            nome: firstLead?.nome || 'João Silva',
            oferta: campaignData.offerConfig.name || 'Oferta Especial',
            desconto: campaignData.offerConfig.discount || '30% OFF',
            link: campaignData.offerConfig.link || 'https://exemplo.com/oferta',
            descricao: campaignData.offerConfig.description || 'Descrição da oferta especial',
            empresa: firstLead?.empresa || 'Empresa Exemplo',
            cpf: firstLead?.cpf || '123.456.789-00'
        };
    };
    // Função para abrir preview do email
    // Função para abrir preview do email
    const handlePreviewEmail = () => {
        if (!campaignData.emailTemplate) {
            setErrors(['Gere ou cole um template de email primeiro.']);
            return;
        }
        setShowEmailPreview(true);
    };
    // Validação automática do template
    useEffect(() => {
        if (campaignData.emailTemplate) {
            const validation = validateEmailTemplate(campaignData.emailTemplate);
            setTemplateValidation(validation);
        }
        else {
            setTemplateValidation(null);
        }
    }, [campaignData.emailTemplate]);
    // Handlers para os modais
    const handleCloseCampaignSuccess = () => {
        setShowCampaignSuccess(false);
        setCampaignStats(null);
        // Resetar para o primeiro step
        setCurrentStep(1);
        setCampaignData({
            leads: [],
            offerConfig: { name: '', discount: '', link: '', description: '' },
            emailTemplate: '',
            emailSubject: '', // ✅ NOVO: Reset do assunto
            templateVariables: {},
            selectedDomain: '' // ✅ CORREÇÃO: Incluir selectedDomain no reset
        });
        setIsLargeCampaign(false);
        setCampaignMode('detecting');
    };
    const handleCreateNewCampaign = () => {
        handleCloseCampaignSuccess();
    };
    // ========== SISTEMA HÍBRIDO: DUAS MUTATIONS DIFERENTES ==========
    // Mutation para CAMPANHAS PEQUENAS (≤100 leads) - Sistema atual mantido 100% intacto
    const createSmallCampaignMutation = useMutation({
        mutationFn: async (data) => {
            if (!user?.id)
                throw new Error('Usuário não autenticado');
            console.log('🚀 [SISTEMA ATUAL] Iniciando campanha pequena:', data.leads.length, 'leads');
            console.log('🔍 [DEBUG] selectedDomain:', data.selectedDomain);
            console.log('🔍 [DEBUG] domain_id que será enviado:', data.selectedDomain || 'undefined');
            // PASSO 1: Criar registro da campanha no banco
            const campaignPayload = {
                campaign: {
                    name: data.offerConfig.name,
                    oferta_nome: data.offerConfig.name,
                    desconto: data.offerConfig.discount,
                    link_da_oferta: data.offerConfig.link,
                    descricao_adicional: data.offerConfig.description,
                    email_template: data.emailTemplate,
                    client_id: user.id,
                    domain_id: data.selectedDomain // ✅ NOVO: Passar domínio para campanhas pequenas também
                },
                leads: data.leads,
                fileName: `campanha_pequena_${Date.now()}.json`
            };
            console.log('📝 [SISTEMA ATUAL] Salvando campanha no banco...');
            const webhookServerUrl = import.meta.env.VITE_WEBHOOK_SERVER_URL || 'http://localhost:3001';
            console.log('🔍 [DEBUG] Webhook Server URL:', webhookServerUrl);
            const campaignResponse = await fetch(`${webhookServerUrl}/api/lead-campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignPayload),
            });
            if (!campaignResponse.ok) {
                const errorText = await campaignResponse.text();
                console.error('❌ Erro ao salvar campanha:', errorText);
                throw new Error(`Erro ao salvar campanha: ${campaignResponse.status}`);
            }
            const campaignResult = await campaignResponse.json();
            console.log('✅ [SISTEMA ATUAL] Campanha salva:', campaignResult);
            // PASSO 2: Enviar emails diretamente via /api/email/queue (sistema atual)
            console.log('📧 [SISTEMA ATUAL] Iniciando envio via /api/email/queue...');
            const emailResults = [];
            let emailsSent = 0;
            let emailsError = 0;
            for (const lead of data.leads) {
                try {
                    console.log(`📨 [SISTEMA ATUAL] Enviando email para: ${lead.email}`);
                    // Personalizar template com variáveis do lead
                    const personalizedTemplate = data.emailTemplate
                        .replace(/{{nome}}/g, lead.nome || 'Cliente')
                        .replace(/{{oferta}}/g, data.offerConfig.name)
                        .replace(/{{desconto}}/g, data.offerConfig.discount || '')
                        .replace(/{{link}}/g, data.offerConfig.link)
                        .replace(/{{descricao}}/g, data.offerConfig.description || '')
                        .replace(/{{cpf}}/g, lead.cpf || '');
                    const emailResponse = await fetch(`${webhookServerUrl}/api/email/queue`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: lead.email,
                            subject: data.emailSubject
                                .replace(/{{nome}}/g, lead.nome || 'Cliente')
                                .replace(/{{oferta}}/g, data.offerConfig.name)
                                .replace(/{{desconto}}/g, data.offerConfig.discount || '')
                                .replace(/{{link}}/g, data.offerConfig.link)
                                .replace(/{{descricao}}/g, data.offerConfig.description || '')
                                .replace(/{{empresa}}/g, lead.empresa || '')
                                .replace(/{{cpf}}/g, lead.cpf || ''),
                            html: personalizedTemplate,
                            context: {
                                nome: lead.nome || 'Cliente',
                                oferta: data.offerConfig.name,
                                desconto: data.offerConfig.discount,
                                link: data.offerConfig.link,
                                descricao: data.offerConfig.description,
                                cpf: lead.cpf || ''
                            },
                            domain_id: data.selectedDomain || undefined // ✅ CORREÇÃO: undefined em vez de string vazia
                        })
                    });
                    if (!emailResponse.ok) {
                        throw new Error(`API retornou: ${emailResponse.status}`);
                    }
                    const emailResult = await emailResponse.json();
                    console.log(`✅ [SISTEMA ATUAL] Email enviado para ${lead.email}:`, emailResult);
                    emailResults.push({ email: lead.email, success: true, result: emailResult });
                    emailsSent++;
                }
                catch (emailErr) {
                    console.error(`❌ [SISTEMA ATUAL] Erro ao enviar email para ${lead.email}:`, emailErr);
                    emailResults.push({
                        email: lead.email,
                        success: false,
                        error: emailErr instanceof Error ? emailErr.message : 'Erro desconhecido'
                    });
                    emailsError++;
                }
                // Pequeno delay para não sobrecarregar a API
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            console.log(`🎉 [SISTEMA ATUAL] Disparo finalizado! Enviados: ${emailsSent}, Erros: ${emailsError}`);
            return {
                campaign: campaignResult,
                emails: {
                    total: data.leads.length,
                    sent: emailsSent,
                    errors: emailsError,
                    details: emailResults
                }
            };
        },
        onSuccess: (data) => {
            console.log('🎉 [SISTEMA ATUAL] Campanha pequena finalizada!', data);
            const { emails, campaign } = data;
            const endTime = new Date();
            const processingTime = 'Processamento instantâneo';
            // Preparar dados para o modal de sucesso
            const stats = {
                totalEmails: emails.total,
                successEmails: emails.sent,
                failedEmails: emails.errors,
                processingTime,
                campaignType: 'pequena',
                campaignId: campaign.id
            };
            setCampaignStats(stats);
            setShowCampaignSuccess(true);
        },
        onError: (error) => {
            console.error('❌ [SISTEMA ATUAL] Erro ao criar campanha pequena:', error);
            setErrors([error.message || 'Erro ao iniciar a campanha. Tente novamente.']);
        }
    });
    // Mutation para CAMPANHAS GRANDES (>100 leads) - Sistema enterprise
    const createLargeCampaignMutation = useMutation({
        mutationFn: async (data) => {
            if (!user?.id)
                throw new Error('Usuário não autenticado');
            console.log('🚀 [SISTEMA ENTERPRISE] Iniciando campanha grande:', data.leads.length, 'leads');
            const webhookServerUrl = import.meta.env.VITE_WEBHOOK_SERVER_URL || 'http://localhost:3001';
            // Criar registro da campanha no banco primeiro
            const campaignPayload = {
                campaign: {
                    name: data.offerConfig.name,
                    oferta_nome: data.offerConfig.name,
                    desconto: data.offerConfig.discount,
                    link_da_oferta: data.offerConfig.link,
                    descricao_adicional: data.offerConfig.description,
                    email_template: data.emailTemplate,
                    client_id: user.id
                },
                leads: data.leads,
                fileName: `campanha_enterprise_${Date.now()}.json`
            };
            console.log('📝 [SISTEMA ENTERPRISE] Salvando campanha no banco...');
            const campaignResponse = await fetch(`${webhookServerUrl}/api/lead-campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignPayload),
            });
            if (!campaignResponse.ok) {
                throw new Error(`Erro ao salvar campanha: ${campaignResponse.status}`);
            }
            const campaignResult = await campaignResponse.json();
            console.log('✅ [SISTEMA ENTERPRISE] Campanha salva:', campaignResult);
            // Enviar via massa email queue (sistema enterprise) - PAYLOAD CORRIGIDO
            const massEmailPayload = {
                campaign_id: campaignResult.campaign.id, // ✅ CORREÇÃO: campaign está dentro de campaign
                user_id: user.id,
                total_leads: data.leads.length, // ✅ URGENTE: Campo obrigatório que estava faltando!
                batch_size: 50, // ✅ URGENTE: Campo obrigatório que estava faltando!
                rate_limit_per_second: 90, // ✅ URGENTE: Campo obrigatório que estava faltando!
                campaign_config: {
                    name: data.offerConfig.name,
                    subject_template: data.emailSubject,
                    html_template: data.emailTemplate,
                    oferta_nome: data.offerConfig.name,
                    desconto: data.offerConfig.discount,
                    link_da_oferta: data.offerConfig.link,
                    descricao_adicional: data.offerConfig.description,
                    domain_id: data.selectedDomain // ✅ NOVO: Passar domínio selecionado
                },
                created_at: new Date().toISOString(),
                priority: 0
            };
            console.log('📧 [SISTEMA ENTERPRISE] Enviando via /api/mass-email/start...');
            const massEmailResponse = await fetch(`${webhookServerUrl}/api/mass-email/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(massEmailPayload)
            });
            if (!massEmailResponse.ok) {
                throw new Error(`Erro ao iniciar campanha enterprise: ${massEmailResponse.status}`);
            }
            const massEmailResult = await massEmailResponse.json();
            console.log('✅ [SISTEMA ENTERPRISE] Campanha enterprise iniciada:', massEmailResult);
            return {
                campaign: campaignResult,
                isMassEmail: true,
                campaignId: campaignResult.id
            };
        },
        onSuccess: (data) => {
            console.log('🎉 [SISTEMA ENTERPRISE] Campanha grande iniciada!', data);
            // Para campanhas grandes, não mostramos alert - vamos para o tracker
            setActiveCampaignId(data.campaignId);
            setCurrentStep(4); // Ir para o step de monitoramento
        },
        onError: (error) => {
            console.error('❌ [SISTEMA ENTERPRISE] Erro ao criar campanha grande:', error);
            setErrors([error.message || 'Erro ao iniciar a campanha enterprise. Tente novamente.']);
        }
    });
    // Step 4: Disparar campanha - escolhe automaticamente o sistema certo
    const handleLaunchCampaign = () => {
        if (!campaignData.leads.length) {
            setErrors(['Nenhum lead carregado']);
            return;
        }
        if (!campaignData.emailTemplate) {
            setErrors(['Template de email não configurado']);
            return;
        }
        // 🎯 SELEÇÃO AUTOMÁTICA DO SISTEMA
        if (isLargeCampaign) {
            console.log('🚀 Usando SISTEMA ENTERPRISE para', campaignData.leads.length, 'leads');
            createLargeCampaignMutation.mutate(campaignData);
        }
        else {
            console.log('🚀 Usando SISTEMA ATUAL para', campaignData.leads.length, 'leads');
            createSmallCampaignMutation.mutate(campaignData);
        }
    };
    // Validações para navegação
    const canProceedToStep = (step) => {
        switch (step) {
            case 2:
                return campaignData.leads.length > 0;
            case 3:
                return Boolean(campaignData.offerConfig.name && campaignData.offerConfig.discount &&
                    campaignData.offerConfig.link && campaignData.offerConfig.description);
            case 4:
                return !!campaignData.emailTemplate && campaignData.emailSubject.trim().length > 0;
            default:
                return true;
        }
    };
    const nextStep = () => {
        if (currentStep < 4 && canProceedToStep(currentStep + 1)) {
            setCurrentStep(currentStep + 1);
            setErrors([]);
        }
    };
    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setErrors([]);
        }
    };
    // Handler para completar campanha grande
    const handleCampaignComplete = (status) => {
        console.log('🎉 Campanha enterprise finalizada:', status);
        // Resetar estado
        setCurrentStep(1);
        setCampaignData({
            leads: [],
            offerConfig: { name: '', discount: '', link: '', description: '' },
            emailTemplate: '',
            emailSubject: '', // ✅ NOVO: Reset do assunto
            templateVariables: {},
            selectedDomain: '' // ✅ CORREÇÃO: Incluir selectedDomain no reset
        });
        setIsLargeCampaign(false);
        setCampaignMode('detecting');
        setActiveCampaignId(null);
    };
    const handleCampaignError = (error) => {
        setErrors([error]);
    };
    return (_jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "card mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-2 flex items-center", children: [_jsx(Sparkles, { className: "w-8 h-8 text-indigo-600 mr-3" }), "Disparo em Massa"] }), _jsx("p", { className: "text-gray-600", children: "Configure e execute campanhas de email para seus leads" })] }), campaignMode !== 'detecting' && (_jsxs("div", { className: `inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${campaignMode === 'large'
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : 'bg-green-50 text-green-800 border-green-200'}`, children: [_jsx(Zap, { className: `w-4 h-4 mr-2 ${campaignMode === 'large' ? 'text-purple-600' : 'text-green-600'}` }), campaignMode === 'large' ? 'Sistema Enterprise' : 'Sistema Atual'] }))] }), _jsxs("div", { className: "flex items-center justify-between pt-4 border-t border-gray-100", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "flex items-center text-sm", children: autoSaving ? (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "w-4 h-4 text-indigo-600 animate-spin mr-2" }), _jsx("span", { className: "text-indigo-600", children: "Salvando..." })] })) : hasUnsavedChanges ? (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4 text-orange-600 mr-2" }), _jsx("span", { className: "text-orange-600", children: "N\u00E3o salvo" })] })) : lastSaved ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-600 mr-2" }), _jsxs("span", { className: "text-green-600", children: ["Salvo \u00E0s ", lastSaved.toLocaleTimeString('pt-BR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })] })] })) : null }), _jsx("div", { className: "flex items-center text-sm", children: formValid ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-600 mr-2" }), _jsx("span", { className: "text-green-600", children: "Tudo v\u00E1lido" })] })) : (_jsxs(_Fragment, { children: [_jsx(AlertCircle, { className: "w-4 h-4 text-red-600 mr-2" }), _jsx("span", { className: "text-red-600", children: "Revisar campos" })] })) })] }), _jsx("div", { className: "flex items-center space-x-2", children: hasUnsavedChanges && (_jsx("button", { onClick: saveNow, disabled: autoSaving, className: "btn-secondary text-sm", children: "Salvar Agora" })) })] })] }), _jsx("div", { className: "mb-8", children: _jsx(DeliverabilityGuide, {}) }), campaignData.leads.length > 0 && (_jsx("div", { className: `mb-6 p-4 rounded-lg border ${isLargeCampaign
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-green-50 border-green-200'}`, children: _jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: `w-5 h-5 mr-2 ${isLargeCampaign ? 'text-purple-600' : 'text-green-600'}` }), _jsxs("div", { children: [_jsx("h3", { className: `font-medium ${isLargeCampaign ? 'text-purple-800' : 'text-green-800'}`, children: isLargeCampaign ? 'Campanha Grande Detectada!' : 'Campanha Pequena' }), _jsxs("p", { className: `text-sm ${isLargeCampaign ? 'text-purple-700' : 'text-green-700'}`, children: [campaignData.leads.length, " leads \u2022 ", isLargeCampaign
                                            ? 'Será processada pelo sistema enterprise com monitoramento tempo real'
                                            : 'Será processada pelo sistema atual com envio imediato'] })] })] }) })), _jsx("div", { className: "mb-8", children: _jsx("div", { className: "flex items-center justify-between", children: steps.map((step, index) => (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: `flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= step.number
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'border-gray-300 text-gray-400'}`, children: currentStep > step.number ? (_jsx(CheckCircle, { className: "w-6 h-6" })) : (_jsx(step.icon, { className: "w-5 h-5" })) }), _jsxs("div", { className: "mt-2 text-center", children: [_jsx("div", { className: `text-sm font-medium ${currentStep >= step.number ? 'text-indigo-600' : 'text-gray-400'}`, children: step.title }), _jsx("div", { className: "text-xs text-gray-500 max-w-24", children: step.description })] }), index < steps.length - 1 && (_jsx("div", { className: `hidden md:block absolute top-5 w-full h-0.5 ${currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-300'}`, style: { left: '50%', width: '100%', zIndex: -1 } }))] }, step.number))) }) }), errors.length > 0 && (_jsxs("div", { className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-md", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-500 mr-2" }), _jsx("h3", { className: "text-sm font-medium text-red-800", children: "Erros encontrados:" })] }), _jsx("ul", { className: "mt-2 text-sm text-red-700 list-disc list-inside", children: errors.map((error, index) => (_jsx("li", { children: error }, index))) })] })), _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-6 mb-8", children: [currentStep === 1 && (_jsxs("div", { className: "animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-semibold text-gray-900", children: "Upload de Leads" }), _jsx("div", { className: "text-sm text-gray-500", children: "Passo 1 de 4" })] }), _jsx(FileUpload, { onFileSelect: handleFileUpload, accept: ".json", maxSize: 10, placeholder: "Arraste seu arquivo JSON aqui ou clique para selecionar", className: "mb-6" }), campaignData.leads.length > 0 && (_jsxs("div", { className: "animate-scale-in", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-900 flex items-center", children: [_jsx(Users, { className: "w-5 h-5 mr-2 text-indigo-600" }), "Leads Carregados (", campaignData.leads.length, ")"] }), _jsx("div", { className: "text-sm text-gray-500", children: campaignData.leads.length > LARGE_CAMPAIGN_THRESHOLD ? (_jsx("span", { className: "text-purple-600 font-medium", children: "Campanha Grande" })) : (_jsx("span", { className: "text-green-600 font-medium", children: "Campanha Pequena" })) })] }), _jsxs("div", { className: "bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200", children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: campaignData.leads.slice(0, 12).map((lead, index) => (_jsx("div", { className: "bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-xs font-medium text-indigo-600", children: lead.nome.charAt(0).toUpperCase() }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: lead.nome }), _jsx("p", { className: "text-xs text-gray-500 truncate", children: lead.email }), lead.empresa && (_jsx("p", { className: "text-xs text-gray-400 truncate", children: lead.empresa }))] })] }) }, index))) }), campaignData.leads.length > 12 && (_jsx("div", { className: "mt-4 text-center", children: _jsxs("div", { className: "inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), "+", campaignData.leads.length - 12, " leads adicionais"] }) }))] }), _jsxs("div", { className: "mt-4 grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white rounded-lg p-4 border border-gray-200 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-indigo-600", children: campaignData.leads.length }), _jsx("div", { className: "text-sm text-gray-600", children: "Total de Leads" })] }), _jsxs("div", { className: "bg-white rounded-lg p-4 border border-gray-200 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: campaignData.leads.filter(lead => lead.empresa).length }), _jsx("div", { className: "text-sm text-gray-600", children: "Com Empresa" })] }), _jsxs("div", { className: "bg-white rounded-lg p-4 border border-gray-200 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: campaignData.leads.filter(lead => lead.telefone).length }), _jsx("div", { className: "text-sm text-gray-600", children: "Com Telefone" })] }), _jsxs("div", { className: "bg-white rounded-lg p-4 border border-gray-200 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: campaignData.leads.length > LARGE_CAMPAIGN_THRESHOLD ? 'Grande' : 'Pequena' }), _jsx("div", { className: "text-sm text-gray-600", children: "Campanha" })] })] })] })), _jsxs("div", { className: "mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsxs("h4", { className: "font-medium text-blue-900 mb-2 flex items-center", children: [_jsx(BookOpen, { className: "w-4 h-4 mr-2" }), "Dicas para o arquivo JSON"] }), _jsxs("div", { className: "text-sm text-blue-700 space-y-1", children: [_jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "Campos obrigat\u00F3rios:" }), " nome, email"] }), _jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "Campos opcionais:" }), " empresa, telefone, cpf"] }), _jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "Formato:" }), " Array de objetos JSON"] }), _jsxs("p", { children: ["\u2022 ", _jsx("strong", { children: "Exemplo:" }), " {\"nome\":\"Jo\u00E3o\",\"email\":\"joao@email.com\",\"cpf\":\"123.456.789-00\"}"] })] })] }), _jsx("div", { className: "mt-6", children: _jsx(DeliverabilityTips, {}) })] })), currentStep === 2 && (_jsxs("div", { className: "animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-semibold text-gray-900", children: "Configurar Oferta" }), _jsx("div", { className: "text-sm text-gray-500", children: "Passo 2 de 4" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Nome da Oferta *" }), _jsx("input", { type: "text", value: campaignData.offerConfig.name, onChange: (e) => handleOfferConfigChange('name', e.target.value), onBlur: () => markFieldAsTouched('name'), className: `form-input ${getFieldError('name') ? 'border-red-300 focus:ring-red-500' :
                                                    campaignData.offerConfig.name && !getFieldError('name') ? 'border-green-300 focus:ring-green-500' : ''}`, placeholder: "Ex: Promo\u00E7\u00E3o Black Friday" }), getFieldError('name') && (_jsx("p", { className: "form-error", children: getFieldError('name') })), getFieldWarning('name') && (_jsx("p", { className: "text-yellow-600 text-sm mt-1", children: getFieldWarning('name') })), getFieldSuggestion('name') && (_jsx("p", { className: "text-blue-600 text-sm mt-1", children: getFieldSuggestion('name') }))] }), _jsxs("div", { children: [_jsx("label", { className: "form-label", children: "Desconto *" }), _jsx("input", { type: "text", value: campaignData.offerConfig.discount, onChange: (e) => handleOfferConfigChange('discount', e.target.value), onBlur: () => markFieldAsTouched('discount'), className: `form-input ${getFieldError('discount') ? 'border-red-300 focus:ring-red-500' :
                                                    campaignData.offerConfig.discount && !getFieldError('discount') ? 'border-green-300 focus:ring-green-500' : ''}`, placeholder: "Ex: 30% OFF" }), getFieldError('discount') && (_jsx("p", { className: "form-error", children: getFieldError('discount') })), getFieldSuggestion('discount') && (_jsx("p", { className: "text-blue-600 text-sm mt-1", children: getFieldSuggestion('discount') }))] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "form-label", children: "Link da Oferta *" }), _jsx("input", { type: "url", value: campaignData.offerConfig.link, onChange: (e) => handleOfferConfigChange('link', e.target.value), onBlur: () => markFieldAsTouched('link'), className: `form-input ${getFieldError('link') ? 'border-red-300 focus:ring-red-500' :
                                                    campaignData.offerConfig.link && !getFieldError('link') ? 'border-green-300 focus:ring-green-500' : ''}`, placeholder: "https://exemplo.com/oferta" }), getFieldError('link') && (_jsx("p", { className: "form-error", children: getFieldError('link') }))] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "form-label", children: "Descri\u00E7\u00E3o Adicional *" }), _jsx("textarea", { value: campaignData.offerConfig.description, onChange: (e) => handleOfferConfigChange('description', e.target.value), onBlur: () => markFieldAsTouched('description'), rows: 4, className: `form-input ${getFieldError('description') ? 'border-red-300 focus:ring-red-500' :
                                                    campaignData.offerConfig.description && !getFieldError('description') ? 'border-green-300 focus:ring-green-500' : ''}`, placeholder: "Descreva os benef\u00EDcios da oferta, diferenciais e chamada para a\u00E7\u00E3o..." }), getFieldError('description') && (_jsx("p", { className: "form-error", children: getFieldError('description') })), getFieldSuggestion('description') && (_jsx("p", { className: "text-blue-600 text-sm mt-1", children: getFieldSuggestion('description') })), _jsx("div", { className: "mt-2 text-right", children: _jsxs("span", { className: `text-sm ${campaignData.offerConfig.description.length < 50 ? 'text-gray-500' :
                                                        campaignData.offerConfig.description.length < 100 ? 'text-yellow-600' : 'text-green-600'}`, children: [campaignData.offerConfig.description.length, " caracteres"] }) })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "\uD83C\uDF10 Dom\u00EDnio de Email" }), _jsxs("select", { value: campaignData.selectedDomain || '', onChange: (e) => {
                                                    console.log('🔧 [DEBUG] Dropdown mudou para:', e.target.value);
                                                    setCampaignData(prev => ({
                                                        ...prev,
                                                        selectedDomain: e.target.value,
                                                        offerConfig: { ...prev.offerConfig, domain_id: e.target.value || undefined }
                                                    }));
                                                    console.log('🔧 [DEBUG] Estado atualizado - selectedDomain:', e.target.value);
                                                }, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500", disabled: domainsLoading, children: [_jsx("option", { value: "", children: "\uD83C\uDFE0 Usar dom\u00EDnio padr\u00E3o (viaforteexpress.com)" }), availableDomains
                                                        .map((domain) => (_jsxs("option", { value: domain.id, children: [domain.is_default ? '🏠' : '📧', " ", domain.domain_name, " - ", domain.from_name, domain.is_default ? ' (padrão)' : ''] }, domain.id)))] }), campaignData.selectedDomain && (_jsx("div", { className: "mt-2 p-3 bg-blue-50 border border-blue-200 rounded", children: (() => {
                                                    const selectedDomain = availableDomains.find((d) => d.id === campaignData.selectedDomain);
                                                    return selectedDomain ? (_jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-medium text-blue-800", children: "\uD83D\uDCE7 Dom\u00EDnio Selecionado:" }), _jsx("p", { className: "text-blue-700", children: _jsxs("span", { className: "font-mono", children: [selectedDomain.from_name, " <", selectedDomain.from_email, ">"] }) }), _jsx("p", { className: "text-blue-600 text-xs mt-1", children: "Emails ser\u00E3o enviados usando este dom\u00EDnio personalizado" })] })) : null;
                                                })() })), !campaignData.selectedDomain && (_jsx("div", { className: "mt-2 p-3 bg-gray-50 border border-gray-200 rounded", children: _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-medium text-gray-800", children: "\uD83C\uDFE0 Dom\u00EDnio Padr\u00E3o:" }), _jsx("p", { className: "text-gray-700", children: _jsx("span", { className: "font-mono", children: "VIA FORTE EXPRESS <contato@viaforteexpress.com>" }) }), _jsx("p", { className: "text-gray-600 text-xs mt-1", children: "Usando configura\u00E7\u00E3o padr\u00E3o do sistema" })] }) })), domainsLoading && (_jsx("p", { className: "text-sm text-gray-500 mt-2", children: "Carregando dom\u00EDnios dispon\u00EDveis..." }))] })] })] })), currentStep === 3 && (_jsxs("div", { className: "animate-fade-in", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-2xl font-semibold text-gray-900", children: "Design do Template" }), _jsx("div", { className: "text-sm text-gray-500", children: "Passo 3 de 4" })] }), _jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex items-center space-x-4 mb-4", children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "Modo de Edi\u00E7\u00E3o:" }), _jsxs("div", { className: "flex bg-gray-100 rounded-lg p-1", children: [_jsx("button", { onClick: () => handleEditModeChange(true), className: `px-4 py-2 rounded-md text-sm font-medium transition-all ${usePredefinedTemplates
                                                        ? 'bg-white text-indigo-600 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-800'}`, children: "\uD83D\uDCDA Templates Prontos" }), _jsx("button", { onClick: () => handleEditModeChange(false), className: `px-4 py-2 rounded-md text-sm font-medium transition-all ${!usePredefinedTemplates
                                                        ? 'bg-white text-indigo-600 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-800'}`, children: "\u270F\uFE0F Edi\u00E7\u00E3o Manual" })] })] }) }), usePredefinedTemplates ? (
                            /* Modo Templates Pré-definidos */
                            _jsxs("div", { className: "space-y-6", children: [_jsx(TemplateSelector, { onTemplateSelect: handleTemplateSelect, selectedTemplateId: selectedTemplate?.id }), selectedTemplate && (_jsx("div", { className: "animate-scale-in", children: _jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-medium text-green-800 flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-2" }), "Template Selecionado: ", selectedTemplate.name] }), _jsx("p", { className: "text-sm text-green-700 mt-1", children: selectedTemplate.description })] }), _jsxs("button", { onClick: handlePreviewEmail, className: "btn-success text-sm", children: [_jsx(Eye, { className: "w-4 h-4 mr-2" }), "Visualizar"] })] }) }) })), _jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-6 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(Mail, { className: "w-5 h-5 mr-2 text-indigo-600" }), "Assunto do Email"] }), _jsxs("span", { className: "text-sm text-gray-500", children: [campaignData.emailSubject.length, "/100 caracteres"] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "text", value: campaignData.emailSubject, onChange: (e) => setCampaignData(prev => ({
                                                            ...prev,
                                                            emailSubject: e.target.value
                                                        })), placeholder: "Digite o assunto do email (ex: Ol\u00E1 {{nome}}, temos uma novidade para voc\u00EA)", className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500", maxLength: 100 }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-blue-900 mb-2", children: "Vari\u00E1veis Dispon\u00EDveis:" }), _jsxs("div", { className: "flex flex-wrap gap-2 text-sm", children: [_jsx("code", { className: "bg-blue-100 px-2 py-1 rounded text-blue-800", children: '{{nome}}' }), _jsx("code", { className: "bg-blue-100 px-2 py-1 rounded text-blue-800", children: '{{oferta}}' }), _jsx("code", { className: "bg-blue-100 px-2 py-1 rounded text-blue-800", children: '{{desconto}}' }), _jsx("code", { className: "bg-blue-100 px-2 py-1 rounded text-blue-800", children: '{{link}}' }), _jsx("code", { className: "bg-blue-100 px-2 py-1 rounded text-blue-800", children: '{{empresa}}' })] }), _jsxs("p", { className: "text-xs text-blue-700 mt-2", children: ["\uD83D\uDCA1 Dica: Use ", '{{nome}}', " para personalizar e aumentar a taxa de abertura"] })] })] })] }), _jsx(SubjectOptimizer, { subject: campaignData.emailSubject, onSubjectChange: (subject) => {
                                            setCampaignData(prev => ({
                                                ...prev,
                                                emailSubject: subject
                                            }));
                                        } })] })) : (
                            /* Modo Edição Manual */
                            _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("button", { onClick: generateEmailTemplate, className: "btn-primary flex items-center", children: [_jsx(Sparkles, { className: "w-4 h-4 mr-2" }), "Gerar Template Automaticamente"] }), _jsxs("button", { onClick: () => setShowTemplateGuide(true), className: "btn-secondary flex items-center", children: [_jsx(BookOpen, { className: "w-4 h-4 mr-2" }), "\uD83D\uDCD6 Manual de Templates"] }), campaignData.emailTemplate && (_jsxs("button", { onClick: handlePreviewEmail, className: "btn-success flex items-center", children: [_jsx(Eye, { className: "w-4 h-4 mr-2" }), "\uD83D\uDC41\uFE0F Visualizar Template"] }))] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: ["Template HTML (Use ", '{{nome}}', ", ", '{{oferta}}', ", ", '{{desconto}}', ", ", '{{link}}', ", ", '{{descricao}}', ")"] }), _jsx("textarea", { value: campaignData.emailTemplate, onChange: (e) => setCampaignData(prev => ({ ...prev, emailTemplate: e.target.value })), rows: 15, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm", placeholder: "Cole aqui o template HTML do email..." })] }), templateValidation && (_jsxs("div", { className: `mt-4 p-4 rounded-lg border ${templateValidation.isValid
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-200'}`, children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx(Shield, { className: `w-4 h-4 mr-2 ${templateValidation.isValid ? 'text-green-600' : 'text-red-600'}` }), _jsx("span", { className: `text-sm font-medium ${templateValidation.isValid ? 'text-green-800' : 'text-red-800'}`, children: templateValidation.isValid ? 'Template Válido' : 'Template com Problemas' })] }), templateValidation.errors.length > 0 && (_jsxs("div", { className: "mb-2", children: [_jsx("p", { className: "text-xs font-medium text-red-800 mb-1", children: "Erros:" }), templateValidation.errors.map((error, index) => (_jsxs("p", { className: "text-xs text-red-700", children: ["\u2022 ", error] }, index)))] })), templateValidation.warnings.length > 0 && (_jsxs("div", { className: "mb-2", children: [_jsx("p", { className: "text-xs font-medium text-yellow-800 mb-1", children: "Avisos:" }), templateValidation.warnings.slice(0, 2).map((warning, index) => (_jsxs("p", { className: "text-xs text-yellow-700", children: ["\u2022 ", warning] }, index))), templateValidation.warnings.length > 2 && (_jsxs("p", { className: "text-xs text-yellow-600", children: ["... e mais ", templateValidation.warnings.length - 2, " avisos"] }))] })), templateValidation.suggestions.length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-blue-800 mb-1", children: "Sugest\u00F5es:" }), templateValidation.suggestions.slice(0, 2).map((suggestion, index) => (_jsxs("p", { className: "text-xs text-blue-700", children: ["\u2022 ", suggestion] }, index))), templateValidation.suggestions.length > 2 && (_jsxs("p", { className: "text-xs text-blue-600", children: ["... e mais ", templateValidation.suggestions.length - 2, " sugest\u00F5es"] }))] }))] })), _jsxs("div", { className: "mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4", children: [_jsx("h4", { className: "font-medium text-blue-900 mb-2", children: "\uD83D\uDCA1 Vari\u00E1veis Dispon\u00EDveis" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm text-blue-700", children: [_jsxs("div", { children: [_jsx("code", { className: "bg-blue-100 px-1 rounded", children: '{{nome}}' }), " - Nome do cliente"] }), _jsxs("div", { children: [_jsx("code", { className: "bg-blue-100 px-1 rounded", children: '{{oferta}}' }), " - Nome da oferta"] }), _jsxs("div", { children: [_jsx("code", { className: "bg-blue-100 px-1 rounded", children: '{{desconto}}' }), " - Valor do desconto"] }), _jsxs("div", { children: [_jsx("code", { className: "bg-blue-100 px-1 rounded", children: '{{link}}' }), " - Link da oferta"] }), _jsxs("div", { children: [_jsx("code", { className: "bg-blue-100 px-1 rounded", children: '{{descricao}}' }), " - Descri\u00E7\u00E3o adicional"] }), _jsxs("div", { children: [_jsx("code", { className: "bg-blue-100 px-1 rounded", children: '{{empresa}}' }), " - Nome da empresa (opcional)"] })] })] })] }))] })), currentStep === 4 && (_jsx("div", { children: isLargeCampaign && activeCampaignId ? (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Monitoramento da Campanha" }), _jsx(CampaignProgressTracker, { campaignId: activeCampaignId, onComplete: handleCampaignComplete, onError: handleCampaignError })] })) : (_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Revisar e Disparar" }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-6 mb-6", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-4", children: "Resumo da Campanha" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Leads:" }), " ", campaignData.leads.length] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Sistema:" }), " ", isLargeCampaign ? 'Enterprise' : 'Atual'] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Oferta:" }), " ", campaignData.offerConfig.name] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Desconto:" }), " ", campaignData.offerConfig.discount] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("span", { className: "font-medium", children: "Dom\u00EDnio:" }), " ", (() => {
                                                            const selectedDomain = availableDomains.find((d) => d.id === campaignData.selectedDomain);
                                                            return selectedDomain
                                                                ? `${selectedDomain.from_name} <${selectedDomain.from_email}>`
                                                                : 'VIA FORTE EXPRESS <contato@viaforteexpress.com> (padrão)';
                                                        })()] })] })] }), _jsx("div", { className: "flex justify-center", children: _jsx("button", { onClick: handleLaunchCampaign, disabled: createSmallCampaignMutation.isPending || createLargeCampaignMutation.isPending, className: "bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center", children: (createSmallCampaignMutation.isPending || createLargeCampaignMutation.isPending) ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" }), "Iniciando..."] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "w-5 h-5 mr-2" }), "Disparar Campanha"] })) }) })] })) }))] }), currentStep < 4 && (_jsxs("div", { className: "space-y-4", children: [currentStep === 3 && !campaignData.emailSubject.trim() && (_jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-yellow-600 mr-2" }), _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-medium text-yellow-800", children: "Configure o assunto do email" }), _jsxs("p", { className: "text-yellow-700 mt-1", children: ["O assunto \u00E9 obrigat\u00F3rio para prosseguir. Use vari\u00E1veis como ", '{{nome}}', " para personaliza\u00E7\u00E3o."] })] })] }) })), _jsxs("div", { className: "flex justify-between", children: [_jsxs("button", { onClick: prevStep, disabled: currentStep === 1, className: "flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Anterior"] }), _jsxs("button", { onClick: nextStep, disabled: !canProceedToStep(currentStep + 1), className: "flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: ["Pr\u00F3ximo", _jsx(ArrowRight, { className: "w-4 h-4 ml-2" })] })] })] })), _jsx(EmailPreviewModal, { isOpen: showEmailPreview, onClose: () => setShowEmailPreview(false), template: campaignData.emailTemplate, sampleData: getSampleData(), subject: campaignData.emailSubject
                    .replace(/{{nome}}/g, getSampleData().nome)
                    .replace(/{{oferta}}/g, campaignData.offerConfig.name)
                    .replace(/{{desconto}}/g, campaignData.offerConfig.discount || '')
                    .replace(/{{link}}/g, campaignData.offerConfig.link)
                    .replace(/{{descricao}}/g, campaignData.offerConfig.description || '')
                    .replace(/{{empresa}}/g, getSampleData().empresa || '') }), _jsx(CampaignSuccessModal, { isOpen: showCampaignSuccess && campaignStats !== null, onClose: handleCloseCampaignSuccess, campaignStats: campaignStats, onCreateNew: handleCreateNewCampaign }), _jsx(TemplateGuide, { isOpen: showTemplateGuide, onClose: () => setShowTemplateGuide(false) })] }));
};
export default DisparoEmMassa;
