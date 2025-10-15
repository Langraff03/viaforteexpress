import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { validateEmailTemplate, ValidationResult } from '../lib/templateValidator';
import { getAvailableEmailDomains } from '../lib/emailService-frontend'; // ✅ Frontend seguro
import { useAutoSave } from '../hooks/useAutoSave';
import { useValidation, ValidationRule } from '../hooks/useValidation';
import { EMAIL_TEMPLATES, getTemplateById, EmailTemplate } from '../lib/emailTemplates';
import type { EmailDomain } from '../types';

interface Lead {
  nome: string;
  email: string;
  empresa?: string;
  telefone?: string;
  cpf?: string;
}

interface OfferConfig {
  name: string;
  discount: string;
  link: string;
  description: string;
  domain_id?: string; // ✅ NOVO: ID do domínio selecionado
}

interface CampaignData {
  leads: Lead[];
  offerConfig: OfferConfig;
  emailTemplate: string;
  emailSubject: string; // ✅ NOVO: Assunto totalmente configurável
  templateVariables: Record<string, any>;
  selectedDomain?: string; // ✅ NOVO: Domínio selecionado para a campanha
}

const DisparoEmMassa: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState<CampaignData>({
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

  const [errors, setErrors] = useState<string[]>([]);

  // ✅ NOVO: Query para carregar domínios disponíveis
  const {
    data: availableDomains = [],
    isLoading: domainsLoading
  } = useQuery({
    queryKey: ['availableEmailDomains'],
    queryFn: getAvailableEmailDomains,
    refetchInterval: 60000, // Atualizar a cada 60s
  });

  // ✅ NOVO: Sistema de Auto-save
  const {
    isSaving: autoSaving,
    lastSaved,
    hasUnsavedChanges,
    error: autoSaveError,
    saveNow,
    clearData: clearAutoSave
  } = useAutoSave(campaignData, {
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
  const validationRules: ValidationRule[] = [
    {
      field: 'name',
      validator: (value: string) => value.trim().length >= 3,
      message: 'Nome deve ter pelo menos 3 caracteres',
      required: true
    },
    {
      field: 'discount',
      validator: (value: string) => value.trim().length > 0,
      message: 'Desconto é obrigatório',
      required: true
    },
    {
      field: 'link',
      validator: (value: string) => {
        if (!value) return false;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Link deve ser uma URL válida',
      required: true
    },
    {
      field: 'description',
      validator: (value: string) => value.trim().length >= 10,
      message: 'Descrição deve ter pelo menos 10 caracteres',
      required: true
    }
  ];

  const {
    isValid: formValid,
    errors: validationErrors,
    warnings: validationWarnings,
    suggestions: validationSuggestions,
    markFieldAsTouched,
    getFieldError,
    getFieldWarning,
    getFieldSuggestion,
    resetValidation
  } = useValidation(
    {
      name: campaignData.offerConfig.name,
      discount: campaignData.offerConfig.discount,
      link: campaignData.offerConfig.link,
      description: campaignData.offerConfig.description
    },
    validationRules,
    { debounceMs: 500 }
  );
  
  // Sistema híbrido: detecta campanhas grandes automaticamente
  const [isLargeCampaign, setIsLargeCampaign] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [campaignMode, setCampaignMode] = useState<'detecting' | 'small' | 'large'>('detecting');

  // Estados para os modais
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showCampaignSuccess, setShowCampaignSuccess] = useState(false);
  const [showTemplateGuide, setShowTemplateGuide] = useState(false);
  const [campaignStats, setCampaignStats] = useState<any>(null);
  const [templateValidation, setTemplateValidation] = useState<ValidationResult | null>(null);

  // ✅ NOVO: Estados para templates e modo de edição
  const [usePredefinedTemplates, setUsePredefinedTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const LARGE_CAMPAIGN_THRESHOLD = 100; // Campanhas >100 leads usam sistema enterprise

  const steps = [
    { number: 1, title: 'Upload de Leads', icon: Upload, description: 'Faça upload do arquivo JSON com os leads' },
    { number: 2, title: 'Configurar Oferta', icon: Settings, description: 'Configure os detalhes da oferta' },
    { number: 3, title: 'Design do Template', icon: FileText, description: 'Personalize o template do email' },
    { number: 4, title: isLargeCampaign ? 'Monitorar Campanha' : 'Revisar e Disparar', icon: isLargeCampaign ? Zap : Send, description: isLargeCampaign ? 'Acompanhe o progresso em tempo real' : 'Revise e confirme o envio' }
  ];

  // Step 1: Upload e validação do arquivo
  const handleFileUpload = useCallback((file: File) => {
    if (file.type !== 'application/json') {
      setErrors(['Por favor, selecione um arquivo JSON válido.']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        // Validar estrutura dos leads
        if (!Array.isArray(jsonData)) {
          setErrors(['O arquivo deve conter um array de leads.']);
          return;
        }

        const validLeads: Lead[] = [];
        const validationErrors: string[] = [];

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

      } catch (error) {
        setErrors(['Erro ao ler o arquivo JSON. Verifique se o formato está correto.']);
      }
    };

    reader.readAsText(file);
  }, [LARGE_CAMPAIGN_THRESHOLD]);

  // Step 2: Configurar oferta
  const handleOfferConfigChange = (field: keyof OfferConfig, value: string) => {
    setCampaignData(prev => ({
      ...prev,
      offerConfig: { ...prev.offerConfig, [field]: value }
    }));
    markFieldAsTouched(field);
  };

  // ✅ NOVO: Handler para seleção de template
  const handleTemplateSelect = useCallback((template: EmailTemplate) => {
    setSelectedTemplate(template);
    setCampaignData(prev => ({
      ...prev,
      emailTemplate: template.html,
      emailSubject: template.subject || prev.emailSubject || '{{nome}}, confira nossa mensagem' // ✅ NOVO: Define o assunto do template
    }));
    console.log('🎨 Template selecionado:', template.name);
  }, []);

  // ✅ NOVO: Handler para mudança de modo de edição
  const handleEditModeChange = useCallback((useTemplates: boolean) => {
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
    } else {
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
    mutationFn: async (data: CampaignData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

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
          
        } catch (emailErr) {
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
    onSuccess: (data: { campaign: any; emails: { total: number; sent: number; errors: number; details: any[] } }) => {
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
        campaignType: 'pequena' as const,
        campaignId: campaign.id
      };

      setCampaignStats(stats);
      setShowCampaignSuccess(true);
    },
    onError: (error: Error) => {
      console.error('❌ [SISTEMA ATUAL] Erro ao criar campanha pequena:', error);
      setErrors([error.message || 'Erro ao iniciar a campanha. Tente novamente.']);
    }
  });

  // Mutation para CAMPANHAS GRANDES (>100 leads) - Sistema enterprise
  const createLargeCampaignMutation = useMutation({
    mutationFn: async (data: CampaignData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

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
    onSuccess: (data: { campaign: any; isMassEmail: boolean; campaignId: string }) => {
      console.log('🎉 [SISTEMA ENTERPRISE] Campanha grande iniciada!', data);

      // Para campanhas grandes, não mostramos alert - vamos para o tracker
      setActiveCampaignId(data.campaignId);
      setCurrentStep(4); // Ir para o step de monitoramento
    },
    onError: (error: Error) => {
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
    } else {
      console.log('🚀 Usando SISTEMA ATUAL para', campaignData.leads.length, 'leads');
      createSmallCampaignMutation.mutate(campaignData);
    }
  };

  // Validações para navegação
  const canProceedToStep = (step: number): boolean => {
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
  const handleCampaignComplete = (status: 'completed' | 'failed' | 'cancelled') => {
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

  const handleCampaignError = (error: string) => {
    setErrors([error]);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Moderno */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Sparkles className="w-8 h-8 text-indigo-600 mr-3" />
              Disparo em Massa
            </h1>
            <p className="text-gray-600">Configure e execute campanhas de email para seus leads</p>
          </div>

          {/* Sistema Indicator */}
          {campaignMode !== 'detecting' && (
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${
              campaignMode === 'large'
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-green-50 text-green-800 border-green-200'
            }`}>
              <Zap className={`w-4 h-4 mr-2 ${campaignMode === 'large' ? 'text-purple-600' : 'text-green-600'}`} />
              {campaignMode === 'large' ? 'Sistema Enterprise' : 'Sistema Atual'}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            {/* Auto-save Status */}
            <div className="flex items-center text-sm">
              {autoSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin mr-2" />
                  <span className="text-indigo-600">Salvando...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save className="w-4 h-4 text-orange-600 mr-2" />
                  <span className="text-orange-600">Não salvo</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-green-600">
                    Salvo às {lastSaved.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </>
              ) : null}
            </div>

            {/* Validação Status */}
            <div className="flex items-center text-sm">
              {formValid ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-green-600">Tudo válido</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <span className="text-red-600">Revisar campos</span>
                </>
              )}
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <button
                onClick={saveNow}
                disabled={autoSaving}
                className="btn-secondary text-sm"
              >
                Salvar Agora
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Deliverability Guide */}
      <div className="mb-8">
        <DeliverabilityGuide />
      </div>

      {/* Campaign Size Alert */}
      {campaignData.leads.length > 0 && (
        <div className={`mb-6 p-4 rounded-lg border ${
          isLargeCampaign 
            ? 'bg-purple-50 border-purple-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center">
            <Users className={`w-5 h-5 mr-2 ${isLargeCampaign ? 'text-purple-600' : 'text-green-600'}`} />
            <div>
              <h3 className={`font-medium ${isLargeCampaign ? 'text-purple-800' : 'text-green-800'}`}>
                {isLargeCampaign ? 'Campanha Grande Detectada!' : 'Campanha Pequena'}
              </h3>
              <p className={`text-sm ${isLargeCampaign ? 'text-purple-700' : 'text-green-700'}`}>
                {campaignData.leads.length} leads • {isLargeCampaign 
                  ? 'Será processada pelo sistema enterprise com monitoramento tempo real'
                  : 'Será processada pelo sistema atual com envio imediato'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <div className="mt-2 text-center">
                <div className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 max-w-24">
                  {step.description}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden md:block absolute top-5 w-full h-0.5 ${
                  currentStep > step.number ? 'bg-indigo-600' : 'bg-gray-300'
                }`} style={{ left: '50%', width: '100%', zIndex: -1 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="text-sm font-medium text-red-800">Erros encontrados:</h3>
          </div>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Upload de Leads</h2>
              <div className="text-sm text-gray-500">
                Passo 1 de 4
              </div>
            </div>

            {/* Componente de Upload Moderno */}
            <FileUpload
              onFileSelect={handleFileUpload}
              accept=".json"
              maxSize={10}
              placeholder="Arraste seu arquivo JSON aqui ou clique para selecionar"
              className="mb-6"
            />

            {/* Preview dos Leads Carregados */}
            {campaignData.leads.length > 0 && (
              <div className="animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-indigo-600" />
                    Leads Carregados ({campaignData.leads.length})
                  </h3>
                  <div className="text-sm text-gray-500">
                    {campaignData.leads.length > LARGE_CAMPAIGN_THRESHOLD ? (
                      <span className="text-purple-600 font-medium">Campanha Grande</span>
                    ) : (
                      <span className="text-green-600 font-medium">Campanha Pequena</span>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {campaignData.leads.slice(0, 12).map((lead, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-indigo-600">
                              {lead.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {lead.nome}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {lead.email}
                            </p>
                            {lead.empresa && (
                              <p className="text-xs text-gray-400 truncate">
                                {lead.empresa}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {campaignData.leads.length > 12 && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        +{campaignData.leads.length - 12} leads adicionais
                      </div>
                    </div>
                  )}
                </div>

                {/* Estatísticas dos Leads */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{campaignData.leads.length}</div>
                    <div className="text-sm text-gray-600">Total de Leads</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {campaignData.leads.filter(lead => lead.empresa).length}
                    </div>
                    <div className="text-sm text-gray-600">Com Empresa</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {campaignData.leads.filter(lead => lead.telefone).length}
                    </div>
                    <div className="text-sm text-gray-600">Com Telefone</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {campaignData.leads.length > LARGE_CAMPAIGN_THRESHOLD ? 'Grande' : 'Pequena'}
                    </div>
                    <div className="text-sm text-gray-600">Campanha</div>
                  </div>
                </div>
              </div>
            )}

            {/* Dicas de Uso */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Dicas para o arquivo JSON
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Campos obrigatórios:</strong> nome, email</p>
                <p>• <strong>Campos opcionais:</strong> empresa, telefone, cpf</p>
                <p>• <strong>Formato:</strong> Array de objetos JSON</p>
                <p>• <strong>Exemplo:</strong> &#123;"nome":"João","email":"joao@email.com","cpf":"123.456.789-00"&#125;</p>
              </div>
            </div>

            {/* Dicas de Deliverability */}
            <div className="mt-6">
              <DeliverabilityTips />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Configurar Oferta</h2>
              <div className="text-sm text-gray-500">
                Passo 2 de 4
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome da Oferta */}
              <div>
                <label className="form-label">
                  Nome da Oferta *
                </label>
                <input
                  type="text"
                  value={campaignData.offerConfig.name}
                  onChange={(e) => handleOfferConfigChange('name', e.target.value)}
                  onBlur={() => markFieldAsTouched('name')}
                  className={`form-input ${
                    getFieldError('name') ? 'border-red-300 focus:ring-red-500' :
                    campaignData.offerConfig.name && !getFieldError('name') ? 'border-green-300 focus:ring-green-500' : ''
                  }`}
                  placeholder="Ex: Promoção Black Friday"
                />
                {getFieldError('name') && (
                  <p className="form-error">{getFieldError('name')}</p>
                )}
                {getFieldWarning('name') && (
                  <p className="text-yellow-600 text-sm mt-1">{getFieldWarning('name')}</p>
                )}
                {getFieldSuggestion('name') && (
                  <p className="text-blue-600 text-sm mt-1">{getFieldSuggestion('name')}</p>
                )}
              </div>

              {/* Desconto */}
              <div>
                <label className="form-label">
                  Desconto *
                </label>
                <input
                  type="text"
                  value={campaignData.offerConfig.discount}
                  onChange={(e) => handleOfferConfigChange('discount', e.target.value)}
                  onBlur={() => markFieldAsTouched('discount')}
                  className={`form-input ${
                    getFieldError('discount') ? 'border-red-300 focus:ring-red-500' :
                    campaignData.offerConfig.discount && !getFieldError('discount') ? 'border-green-300 focus:ring-green-500' : ''
                  }`}
                  placeholder="Ex: 30% OFF"
                />
                {getFieldError('discount') && (
                  <p className="form-error">{getFieldError('discount')}</p>
                )}
                {getFieldSuggestion('discount') && (
                  <p className="text-blue-600 text-sm mt-1">{getFieldSuggestion('discount')}</p>
                )}
              </div>

              {/* Link da Oferta */}
              <div className="md:col-span-2">
                <label className="form-label">
                  Link da Oferta *
                </label>
                <input
                  type="url"
                  value={campaignData.offerConfig.link}
                  onChange={(e) => handleOfferConfigChange('link', e.target.value)}
                  onBlur={() => markFieldAsTouched('link')}
                  className={`form-input ${
                    getFieldError('link') ? 'border-red-300 focus:ring-red-500' :
                    campaignData.offerConfig.link && !getFieldError('link') ? 'border-green-300 focus:ring-green-500' : ''
                  }`}
                  placeholder="https://exemplo.com/oferta"
                />
                {getFieldError('link') && (
                  <p className="form-error">{getFieldError('link')}</p>
                )}
              </div>

              {/* Descrição Adicional */}
              <div className="md:col-span-2">
                <label className="form-label">
                  Descrição Adicional *
                </label>
                <textarea
                  value={campaignData.offerConfig.description}
                  onChange={(e) => handleOfferConfigChange('description', e.target.value)}
                  onBlur={() => markFieldAsTouched('description')}
                  rows={4}
                  className={`form-input ${
                    getFieldError('description') ? 'border-red-300 focus:ring-red-500' :
                    campaignData.offerConfig.description && !getFieldError('description') ? 'border-green-300 focus:ring-green-500' : ''
                  }`}
                  placeholder="Descreva os benefícios da oferta, diferenciais e chamada para ação..."
                />
                {getFieldError('description') && (
                  <p className="form-error">{getFieldError('description')}</p>
                )}
                {getFieldSuggestion('description') && (
                  <p className="text-blue-600 text-sm mt-1">{getFieldSuggestion('description')}</p>
                )}

                {/* Contador de caracteres */}
                <div className="mt-2 text-right">
                  <span className={`text-sm ${
                    campaignData.offerConfig.description.length < 50 ? 'text-gray-500' :
                    campaignData.offerConfig.description.length < 100 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {campaignData.offerConfig.description.length} caracteres
                  </span>
                </div>
              </div>
              
              {/* ✅ NOVA SEÇÃO: Seleção de Domínio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🌐 Domínio de Email
                </label>
                <select
                  value={campaignData.selectedDomain || ''}
                  onChange={(e) => {
                    console.log('🔧 [DEBUG] Dropdown mudou para:', e.target.value);
                    setCampaignData(prev => ({
                      ...prev,
                      selectedDomain: e.target.value,
                      offerConfig: { ...prev.offerConfig, domain_id: e.target.value || undefined }
                    }));
                    console.log('🔧 [DEBUG] Estado atualizado - selectedDomain:', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={domainsLoading}
                >
                  <option value="">🏠 Usar domínio padrão (viaforteexpress.com)</option>
                  {availableDomains
                    .map((domain: EmailDomain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.is_default ? '🏠' : '📧'} {domain.domain_name} - {domain.from_name}
                        {domain.is_default ? ' (padrão)' : ''}
                      </option>
                  ))}
                </select>
                
                {campaignData.selectedDomain && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    {(() => {
                      const selectedDomain = availableDomains.find((d: EmailDomain) => d.id === campaignData.selectedDomain);
                      return selectedDomain ? (
                        <div className="text-sm">
                          <p className="font-medium text-blue-800">📧 Domínio Selecionado:</p>
                          <p className="text-blue-700">
                            <span className="font-mono">{selectedDomain.from_name} &lt;{selectedDomain.from_email}&gt;</span>
                          </p>
                          <p className="text-blue-600 text-xs mt-1">
                            Emails serão enviados usando este domínio personalizado
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
                
                {!campaignData.selectedDomain && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded">
                    <div className="text-sm">
                      <p className="font-medium text-gray-800">🏠 Domínio Padrão:</p>
                      <p className="text-gray-700">
                        <span className="font-mono">VIA FORTE EXPRESS &lt;contato@viaforteexpress.com&gt;</span>
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        Usando configuração padrão do sistema
                      </p>
                    </div>
                  </div>
                )}
                
                {domainsLoading && (
                  <p className="text-sm text-gray-500 mt-2">Carregando domínios disponíveis...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Design do Template</h2>
              <div className="text-sm text-gray-500">
                Passo 3 de 4
              </div>
            </div>

            {/* Seletor de Modo de Edição */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <label className="text-sm font-medium text-gray-700">Modo de Edição:</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleEditModeChange(true)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      usePredefinedTemplates
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    📚 Templates Prontos
                  </button>
                  <button
                    onClick={() => handleEditModeChange(false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      !usePredefinedTemplates
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    ✏️ Edição Manual
                  </button>
                </div>
              </div>
            </div>

            {usePredefinedTemplates ? (
              /* Modo Templates Pré-definidos */
              <div className="space-y-6">
                <TemplateSelector
                  onTemplateSelect={handleTemplateSelect}
                  selectedTemplateId={selectedTemplate?.id}
                />

                {selectedTemplate && (
                  <div className="animate-scale-in">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-green-800 flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Template Selecionado: {selectedTemplate.name}
                          </h3>
                          <p className="text-sm text-green-700 mt-1">
                            {selectedTemplate.description}
                          </p>
                        </div>
                        <button
                          onClick={handlePreviewEmail}
                          className="btn-success text-sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Campo de Assunto do Email */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-indigo-600" />
                      Assunto do Email
                    </h3>
                    <span className="text-sm text-gray-500">
                      {campaignData.emailSubject.length}/100 caracteres
                    </span>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={campaignData.emailSubject}
                      onChange={(e) => setCampaignData(prev => ({
                        ...prev,
                        emailSubject: e.target.value
                      }))}
                      placeholder="Digite o assunto do email (ex: Olá {{nome}}, temos uma novidade para você)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      maxLength={100}
                    />

                    {/* Variáveis Disponíveis */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Variáveis Disponíveis:</h4>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{{nome}}'}</code>
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{{oferta}}'}</code>
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{{desconto}}'}</code>
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{{link}}'}</code>
                        <code className="bg-blue-100 px-2 py-1 rounded text-blue-800">{'{{empresa}}'}</code>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        💡 Dica: Use {'{{nome}}'} para personalizar e aumentar a taxa de abertura
                      </p>
                    </div>
                  </div>
                </div>

                {/* Otimizador de Assunto */}
                <SubjectOptimizer
                  subject={campaignData.emailSubject}
                  onSubjectChange={(subject) => {
                    setCampaignData(prev => ({
                      ...prev,
                      emailSubject: subject
                    }));
                  }}
                />
              </div>
            ) : (
              /* Modo Edição Manual */
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={generateEmailTemplate}
                    className="btn-primary flex items-center"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Template Automaticamente
                  </button>

                  <button
                    onClick={() => setShowTemplateGuide(true)}
                    className="btn-secondary flex items-center"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    📖 Manual de Templates
                  </button>

                  {campaignData.emailTemplate && (
                    <button
                      onClick={handlePreviewEmail}
                      className="btn-success flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      👁️ Visualizar Template
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template HTML (Use {'{{nome}}'}, {'{{oferta}}'}, {'{{desconto}}'}, {'{{link}}'}, {'{{descricao}}'})
                  </label>
                  <textarea
                    value={campaignData.emailTemplate}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, emailTemplate: e.target.value }))}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="Cole aqui o template HTML do email..."
                  />
                </div>

            {/* Validação do Template */}
            {templateValidation && (
              <div className={`mt-4 p-4 rounded-lg border ${
                templateValidation.isValid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  <Shield className={`w-4 h-4 mr-2 ${
                    templateValidation.isValid ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    templateValidation.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {templateValidation.isValid ? 'Template Válido' : 'Template com Problemas'}
                  </span>
                </div>

                {templateValidation.errors.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-red-800 mb-1">Erros:</p>
                    {templateValidation.errors.map((error, index) => (
                      <p key={index} className="text-xs text-red-700">• {error}</p>
                    ))}
                  </div>
                )}

                {templateValidation.warnings.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-yellow-800 mb-1">Avisos:</p>
                    {templateValidation.warnings.slice(0, 2).map((warning, index) => (
                      <p key={index} className="text-xs text-yellow-700">• {warning}</p>
                    ))}
                    {templateValidation.warnings.length > 2 && (
                      <p className="text-xs text-yellow-600">
                        ... e mais {templateValidation.warnings.length - 2} avisos
                      </p>
                    )}
                  </div>
                )}

                {templateValidation.suggestions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-blue-800 mb-1">Sugestões:</p>
                    {templateValidation.suggestions.slice(0, 2).map((suggestion, index) => (
                      <p key={index} className="text-xs text-blue-700">• {suggestion}</p>
                    ))}
                    {templateValidation.suggestions.length > 2 && (
                      <p className="text-xs text-blue-600">
                        ... e mais {templateValidation.suggestions.length - 2} sugestões
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dicas de Template */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Variáveis Disponíveis</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                <div><code className="bg-blue-100 px-1 rounded">{'{{nome}}'}</code> - Nome do cliente</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{{oferta}}'}</code> - Nome da oferta</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{{desconto}}'}</code> - Valor do desconto</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{{link}}'}</code> - Link da oferta</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{{descricao}}'}</code> - Descrição adicional</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{{empresa}}'}</code> - Nome da empresa (opcional)</div>
              </div>
            </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div>
            {isLargeCampaign && activeCampaignId ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">Monitoramento da Campanha</h2>
                <CampaignProgressTracker
                  campaignId={activeCampaignId}
                  onComplete={handleCampaignComplete}
                  onError={handleCampaignError}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-4">Revisar e Disparar</h2>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Resumo da Campanha</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Leads:</span> {campaignData.leads.length}
                    </div>
                    <div>
                      <span className="font-medium">Sistema:</span> {isLargeCampaign ? 'Enterprise' : 'Atual'}
                    </div>
                    <div>
                      <span className="font-medium">Oferta:</span> {campaignData.offerConfig.name}
                    </div>
                    <div>
                      <span className="font-medium">Desconto:</span> {campaignData.offerConfig.discount}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">Domínio:</span> {(() => {
                        const selectedDomain = availableDomains.find((d: EmailDomain) => d.id === campaignData.selectedDomain);
                        return selectedDomain
                          ? `${selectedDomain.from_name} <${selectedDomain.from_email}>`
                          : 'VIA FORTE EXPRESS <contato@viaforteexpress.com> (padrão)';
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleLaunchCampaign}
                    disabled={createSmallCampaignMutation.isPending || createLargeCampaignMutation.isPending}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {(createSmallCampaignMutation.isPending || createLargeCampaignMutation.isPending) ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Iniciando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Disparar Campanha
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {currentStep < 4 && (
        <div className="space-y-4">
          {/* Aviso para passo 3 */}
          {currentStep === 3 && !campaignData.emailSubject.trim() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Configure o assunto do email</p>
                  <p className="text-yellow-700 mt-1">
                    O assunto é obrigatório para prosseguir. Use variáveis como {'{{nome}}'} para personalização.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </button>

            <button
              onClick={nextStep}
              disabled={!canProceedToStep(currentStep + 1)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Modais */}
      <EmailPreviewModal
        isOpen={showEmailPreview}
        onClose={() => setShowEmailPreview(false)}
        template={campaignData.emailTemplate}
        sampleData={getSampleData()}
        subject={campaignData.emailSubject
          .replace(/{{nome}}/g, getSampleData().nome)
          .replace(/{{oferta}}/g, campaignData.offerConfig.name)
          .replace(/{{desconto}}/g, campaignData.offerConfig.discount || '')
          .replace(/{{link}}/g, campaignData.offerConfig.link)
          .replace(/{{descricao}}/g, campaignData.offerConfig.description || '')
          .replace(/{{empresa}}/g, getSampleData().empresa || '')
        }
      />

      <CampaignSuccessModal
        isOpen={showCampaignSuccess && campaignStats !== null}
        onClose={handleCloseCampaignSuccess}
        campaignStats={campaignStats}
        onCreateNew={handleCreateNewCampaign}
      />

      <TemplateGuide
        isOpen={showTemplateGuide}
        onClose={() => setShowTemplateGuide(false)}
      />
    </div>
  );
};

export default DisparoEmMassa;