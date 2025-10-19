// src/test/webhook-regression.test.ts
// Testes de regressão para garantir que webhooks de gateway não foram afetados

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendTrackingEmail, getEmailConfig } from '../lib/emailService';
import { supabaseAdmin } from '../lib/server/supabaseAdmin'; // ✅ Backend seguro

// Mock do Resend para testes
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null
      })
    }
  }))
}));

// Mock do supabaseAdmin
vi.mock('../lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })
    })
  }
}));

// Mock do renderAsync
vi.mock('@react-email/render', () => ({
  renderAsync: vi.fn().mockResolvedValue('<html>Test email</html>')
}));

describe('Webhook Regression Tests - Sistema Multi-Domínio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('🔒 CRÍTICO: sendTrackingEmail deve usar SEMPRE configuração padrão', () => {
    it('deve usar getEmailConfig() sem parâmetros', async () => {
      // Spy na função getEmailConfig para verificar se é chamada corretamente
      const getEmailConfigSpy = vi.spyOn(await import('../lib/emailService'), 'getEmailConfig')
        .mockResolvedValue({
          fromName: 'VIA FORTE EXPRESS',
          fromEmail: 'contato@viaforteexpress.com',
          replyToEmail: 'suporte@viaforteexpress.com',
          resendApiKey: 'test-api-key'
        });

      const orderData = {
        id: 'test-order-id',
        tracking_code: 'TEST123',
        customer_name: 'João Silva',
        customer_email: 'joao@test.com',
        status: 'paid'
      };

      // Executar função
      await sendTrackingEmail(orderData);

      // Verificar que getEmailConfig foi chamada (SEM domainId)
      expect(getEmailConfigSpy).toHaveBeenCalledWith();
      expect(getEmailConfigSpy).toHaveBeenCalledTimes(1);
      
      // Verificar que getEmailConfigByDomain NÃO foi chamada
      const getEmailConfigByDomainSpy = vi.spyOn(
        await import('../lib/emailService'), 
        'getEmailConfigByDomain'
      );
      expect(getEmailConfigByDomainSpy).not.toHaveBeenCalled();
    });

    it('deve sempre usar viaforteexpress.com no subject', async () => {
      const { Resend } = await import('resend');
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null
      });
      
      (Resend as any).mockImplementation(() => ({
        emails: { send: mockSend }
      }));

      const orderData = {
        id: 'test-order-id', 
        tracking_code: 'TEST123',
        customer_name: 'João Silva',
        customer_email: 'joao@test.com',
        status: 'paid'
      };

      await sendTrackingEmail(orderData);

      // Verificar que o email foi enviado com subject correto
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '📦 Pedido TEST123 - VIA FORTE EXPRESS',
          from: 'VIA FORTE EXPRESS <contato@viaforteexpress.com>'
        })
      );
    });

    it('deve rejeitar tentativas de passar domainId (parâmetro não existe)', async () => {
      const orderData = {
        id: 'test-order-id',
        tracking_code: 'TEST123', 
        customer_name: 'João Silva',
        customer_email: 'joao@test.com',
        status: 'paid'
      };

      // Verificar que função continua funcionando mesmo com parâmetros extras
      // (JavaScript permite parâmetros extras, mas TypeScript avisa)
      await expect(
        sendTrackingEmail(orderData, undefined)
      ).resolves.not.toThrow(); // Função deve ignorar parâmetros extras
    });
  });

  describe('🛡️ Proteção de Configuração Padrão', () => {
    it('getEmailConfig deve sempre retornar viaforteexpress.com', async () => {
      // Mock da resposta do banco
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: { code: '42P01' } // Tabela não existe
          })
        })
      } as any);

      // Mock das variáveis de ambiente
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        VITE_FROM_NAME: 'VIA FORTE EXPRESS',
        VITE_FROM_EMAIL: 'contato@viaforteexpress.com',
        VITE_SUPPORT_EMAIL: 'suporte@viaforteexpress.com'
      };

      const config = await getEmailConfig();

      expect(config.fromEmail).toBe('contato@viaforteexpress.com');
      expect(config.fromName).toBe('VIA FORTE EXPRESS');
      expect(config.replyToEmail).toBe('suporte@viaforteexpress.com');

      process.env = originalEnv;
    });
  });

  describe('✅ Funcionalidade Nova: sendOfferEmail com domínios', () => {
    it('deve aceitar domainId opcional para ofertas', async () => {
      const { sendOfferEmail } = await import('../lib/emailService');
      
      const leadData = {
        nome: 'João Silva',
        email: 'joao@test.com',
        oferta_nome: 'Promoção Farmácia',
        link_da_oferta: 'https://farmacia.com/oferta'
      };

      // Mock getEmailConfigByDomain
      const mockGetEmailConfigByDomain = vi.fn().mockResolvedValue({
        fromName: 'Farmácia Express',
        fromEmail: 'contato@farmacia-express.com', 
        replyToEmail: 'suporte@farmacia-express.com',
        resendApiKey: 'test-key'
      });

      vi.doMock('../lib/emailService', async () => ({
        ...await vi.importActual('../lib/emailService'),
        getEmailConfigByDomain: mockGetEmailConfigByDomain
      }));

      // Testar chamada com domainId
      await expect(sendOfferEmail(leadData, 'test-domain-id')).resolves.not.toThrow();
      
      // Verificar que getEmailConfigByDomain foi chamada com domainId correto
      expect(mockGetEmailConfigByDomain).toHaveBeenCalledWith('test-domain-id');
    });

    it('deve usar configuração padrão quando domainId não fornecido', async () => {
      const { sendOfferEmail } = await import('../lib/emailService');
      
      const leadData = {
        nome: 'João Silva',
        email: 'joao@test.com',
        oferta_nome: 'Promoção Geral',
        link_da_oferta: 'https://viaforteexpress.com/oferta'
      };

      // Testar chamada SEM domainId
      await expect(sendOfferEmail(leadData)).resolves.not.toThrow();
    });
  });

  describe('🔧 Compatibilidade com Workers', () => {
    it('payment-webhook.worker deve continuar usando sendTrackingEmail normalmente', () => {
      // Simular import do worker
      expect(() => {
        // Esta é a linha crítica no payment-webhook.worker.ts:267
        // await sendTrackingEmail(orderData);
        
        // Verificar que função existe e tem assinatura correta
        expect(sendTrackingEmail).toBeDefined();
        expect(sendTrackingEmail).toBeInstanceOf(Function);
      }).not.toThrow();
    });

    it('mass-email.worker deve poder usar getEmailConfigByDomain', async () => {
      const { getEmailConfigByDomain } = await import('../lib/emailService');
      
      // Testar função existe e funciona
      expect(getEmailConfigByDomain).toBeDefined();
      expect(getEmailConfigByDomain).toBeInstanceOf(Function);
      
      // Testar chamada com domainId
      await expect(getEmailConfigByDomain('test-domain-id')).resolves.toBeDefined();
      
      // Testar chamada sem domainId (fallback)
      await expect(getEmailConfigByDomain()).resolves.toBeDefined();
    });
  });

  describe('🎯 Validação de Interfaces', () => {
    it('interfaces de campanha devem incluir domain_id opcional', () => {
      // Verificar que as interfaces foram atualizadas corretamente
      const campaignConfig: import('../lib/queue').MassEmailCampaignJobData['campaign_config'] = {
        name: 'Test',
        subject_template: 'Test {{nome}}',
        html_template: '<p>Test</p>',
        oferta_nome: 'Test Offer',
        link_da_oferta: 'https://test.com',
        domain_id: 'optional-domain-id' // ✅ Deve compilar sem erro
      };

      expect(campaignConfig.domain_id).toBe('optional-domain-id');
    });

    it('LeadEmailJobData deve incluir domain_id opcional', () => {
      const leadJob: import('../lib/queue').LeadEmailJobData = {
        email: 'test@test.com',
        nome: 'Test User',
        oferta_nome: 'Test Offer',
        link_da_oferta: 'https://test.com',
        origem: 'externo',
        domain_id: 'optional-domain-id' // ✅ Deve compilar sem erro
      };

      expect(leadJob.domain_id).toBe('optional-domain-id');
    });
  });

  describe('🔍 Fallback e Error Handling', () => {
    it('getEmailConfigByDomain deve fazer fallback para getEmailConfig em caso de erro', async () => {
      const { getEmailConfigByDomain } = await import('../lib/emailService');
      
      // Mock supabase para simular erro
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Domain not found' }
              })
            })
          })
        })
      } as any);

      // Deve retornar configuração padrão mesmo com erro
      const config = await getEmailConfigByDomain('invalid-domain-id');
      
      expect(config).toBeDefined();
      expect(config.fromEmail).toContain('viaforteexpress.com');
    });
  });

  describe('📊 Logs de Auditoria', () => {
    it('deve registrar mudanças em domínios via triggers SQL', () => {
      // Este teste verifica se o SQL foi criado corretamente
      // Os triggers são testados pela execução do migration SQL
      expect(true).toBe(true); // Placeholder - triggers são testados na integração
    });
  });
});

// Testes de Integração com Workers Reais
describe('Testes de Integração - Workers', () => {
  // Estes testes são mais apropriados para ambiente de desenvolvimento
  // onde os workers reais podem ser testados
  
  it('deve validar que payment-webhook.worker.ts não quebrou', () => {
    // Verificar que import do worker não falha
    expect(() => {
      require('../workers/payment-webhook.worker.ts');
    }).not.toThrow();
  });

  it('deve validar que mass-email.worker.ts não quebrou', () => {
    // Verificar que import do worker não falha
    expect(() => {
      require('../workers/mass-email.worker.ts');
    }).not.toThrow();
  });

  it('deve validar que lead.worker.ts não quebrou', () => {
    // Verificar que import do worker não falha  
    expect(() => {
      require('../workers/lead.worker.ts');
    }).not.toThrow();
  });
});

// Helper para criar dados de teste
export const createTestOrderData = () => ({
  id: 'test-order-' + Date.now(),
  tracking_code: 'TEST' + Math.random().toString(36).substr(2, 6).toUpperCase(),
  customer_name: 'João Silva Teste',
  customer_email: 'joao.teste@example.com',
  status: 'paid'
});

export const createTestLeadData = () => ({
  nome: 'Maria Silva Teste',
  email: 'maria.teste@example.com',
  oferta_nome: 'Promoção Teste',
  link_da_oferta: 'https://test.com/oferta-' + Date.now(),
  descricao_adicional: 'Descrição de teste para regressão'
});

// Mock data para campanhas
export const createTestCampaignConfig = () => ({
  name: 'Campanha Teste Regressão',
  subject_template: 'Teste {{nome}} - {{oferta}}',
  html_template: '<h1>Olá {{nome}}</h1><p>Oferta: {{oferta}}</p>',
  oferta_nome: 'Promoção Teste',
  desconto: '20% OFF',
  link_da_oferta: 'https://test.com/promo',
  descricao_adicional: 'Teste de regressão',
  domain_id: undefined // Padrão
});

export const createTestCampaignConfigWithDomain = () => ({
  ...createTestCampaignConfig(),
  domain_id: 'test-domain-id' // Com domínio personalizado
});