# ANÁLISE COMPLETA DO SISTEMA - MULTI-DOMÍNIO EMAIL

## 📋 RESUMO EXECUTIVO

Sistema robusto de rastreamento e campanhas de email usando:
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Express + Supabase + BullMQ/Redis  
- **Email**: Resend API
- **Workers**: 5 workers especializados

## 🚨 FLUXOS CRÍTICOS - NÃO TOCAR

### 1. Email de Rastreio (Via Webhook)
```
Gateway → genericWebhookHandler → queuePaymentWebhook → 
payment-webhook.worker.ts:267 → sendTrackingEmail() → 
getEmailConfig() → configurations table → frotaexpress.com
```

**Arquivos protegidos:**
- `src/workers/payment-webhook.worker.ts:267` - sendTrackingEmail()
- `src/webhook-server/handlers/genericWebhookHandler.ts:341-361` - enfileira emails
- `src/emails/TrackingEmail.tsx` - template fixo "FROTA EXPRESS"

## ✅ FLUXOS PERSONALIZÁVEIS - SEGURO MODIFICAR

### 1. Email de Ofertas (Campanhas)
```
DisparoEmMassa → queueMassEmailCampaign → mass-email.worker.ts:187 → 
getEmailConfigByDomain() [NOVO] → email_domains table [NOVA] → domínio personalizado
```

**Arquivos seguros:**
- `src/lib/emailService.tsx:171` - sendOfferEmail()
- `src/workers/mass-email.worker.ts:187` - getEmailConfig()  
- `src/workers/lead.worker.ts:402` - sendOfferEmail()
- `src/pages/DisparoEmMassa.tsx` - interface campanhas

## 🏗️ ESTRUTURA ATUAL

### Tabelas Existentes:
- ✅ `clients`, `gateways`, `leads`, `orders`, `profiles`
- ✅ `configurations` (para frotaexpress.com)
- ❌ `email_domains` (PRECISA CRIAR)

### Sistema de Roles:
- **admin**: Acesso completo + nova seção domínios
- **gateway_user**: Sem acesso a domínios
- **freelancer**: Sem acesso a domínios  
- **cliente**: Sem acesso a domínios

### Menu Admin Atual:
```
- Painel
- Pedidos  
- Disparo em Massa [MELHORAR]
- Logs de Email
- Configurações
+ Domínios de Email [NOVO]
```

## 🎯 IMPLEMENTAÇÃO PROPOSTA

### Nova Tabela: `email_domains`
```sql
CREATE TABLE email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    from_name VARCHAR(255) NOT NULL, 
    from_email VARCHAR(255) NOT NULL,
    reply_to_email VARCHAR(255) NOT NULL,
    resend_api_key TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
```

### Nova Função: `getEmailConfigByDomain()`
```typescript
export async function getEmailConfigByDomain(domainId?: string): Promise<EmailConfig> {
  if (!domainId) {
    return getEmailConfig(); // Fallback para padrão
  }
  
  // Buscar domínio específico
  const { data } = await supabase
    .from('email_domains')  
    .select('*')
    .eq('id', domainId)
    .eq('is_active', true)
    .single();
    
  if (!data) {
    return getEmailConfig(); // Fallback se não encontrar
  }
  
  return {
    fromName: data.from_name,
    fromEmail: data.from_email, 
    replyToEmail: data.reply_to_email,
    resendApiKey: data.resend_api_key
  };
}
```

### Modificação: `sendOfferEmail()` 
```typescript
export async function sendOfferEmail(
  lead: LeadData, 
  domainId?: string // NOVO PARÂMETRO OPCIONAL
) {
  const config = await getEmailConfigByDomain(domainId); // USA NOVA FUNÇÃO
  // resto permanece igual...
}
```

## 🛡️ GARANTIAS DE SEGURANÇA

### Proteção 1: sendTrackingEmail() Imutável
```typescript
// NUNCA MUDA - sempre usa getEmailConfig() padrão
export async function sendTrackingEmail(order) {
  const config = await getEmailConfig(); // SEM domainId
  // ...
}
```

### Proteção 2: Webhooks Intocáveis  
```typescript
// payment-webhook.worker.ts:267 - NUNCA TOCAR
await sendTrackingEmail(orderData); // SEM parâmetros extras
```

### Proteção 3: Fallback Automático
```typescript
// Se domainId inválido/não encontrado → frotaexpress.com
if (!domainData) {
  return getEmailConfig(); // Configuração padrão segura
}
```

## 📊 SISTEMA DE CAMPANHAS EXISTENTE

**Já Implementado:**
- ✅ Templates personalizados (`email_template`)
- ✅ Rate limiting inteligente
- ✅ Progress tracking com WebSocket
- ✅ Validação de API keys
- ✅ Sistema de filas robusto

**Precisa Adicionar:**
- ❌ Seleção de domínio na interface
- ❌ CRUD de domínios no admin
- ❌ Integração domainId nos workers

## 🔍 PONTOS DE INTEGRAÇÃO

### 1. Interface Admin
```typescript
// Layout.tsx - adicionar no menu
{ name: 'Domínios de Email', href: '/admin/email-domains', icon: Mail }

// Nova página EmailDomains.tsx
// Componente EmailDomainsManager com CRUD completo
```

### 2. DisparoEmMassa Atualizada
```typescript
// Adicionar seleção de domínio no formulário
const [selectedDomain, setSelectedDomain] = useState('');

// Passar domainId na campanha
campaignConfig.domain_id = selectedDomain;
```

### 3. Workers Atualizados
```typescript
// mass-email.worker.ts:187
const config = await getEmailConfigByDomain(data.campaign_config.domain_id);

// lead.worker.ts:402  
await sendOfferEmail(leadData, campaignConfig.domain_id);
```

## ✨ RESULTADO FINAL

### Para Administradores:
- Interface completa para gerenciar domínios
- Validação de API keys em tempo real
- Logs de auditoria de mudanças
- Seleção de domínio por campanha

### Para Ofertas:
- farmacia-express.com para farmácias
- imobiliaria-express.com para imobiliárias  
- qualquer-dominio.com facilmente adicionável

### Para Rastreio:
- frotaexpress.com SEMPRE
- Compatibilidade 100% preservada
- Zero impacto nos webhooks

### Para Sistema:
- Fallbacks automáticos
- Compatibilidade total
- Performance mantida
- Segurança máxima

## 🎯 IMPLEMENTAÇÃO COMPLETA REALIZADA

### ✅ ARQUIVOS CRIADOS/MODIFICADOS:

#### **1. Base de Dados:**
- `scripts/create-email-domains-table.sql` - Migration completa
- `scripts/populate-default-domain.js` - Script de população

#### **2. Backend/Workers:**
- `src/lib/emailService.tsx` - getEmailConfigByDomain() + proteções
- `src/lib/queue.ts` - Interfaces atualizadas com domain_id
- `src/workers/mass-email.worker.ts` - Suporte a domínios personalizado
- `src/workers/lead.worker.ts` - Integração com domain_id
- `src/lib/domainHelpers.ts` - Funções helper inteligentes

#### **3. API:**
- `src/routes/adminApiRoutes.ts` - CRUD completo de domínios

#### **4. Frontend:**
- `src/types/index.ts` - Interfaces TypeScript completas
- `src/components/Layout.tsx` - Menu atualizado
- `src/App.tsx` - Nova rota /admin/email-domains
- `src/pages/EmailDomains.tsx` - Interface administrativa completa
- `src/pages/DisparoEmMassa.tsx` - Seleção de domínio integrada

#### **5. Testes:**
- `src/test/webhook-regression.test.ts` - Testes de regressão críticos

### 🔧 COMO USAR:

#### **1. Executar Migration:**
```sql
-- No PostgreSQL/Supabase:
\i scripts/create-email-domains-table.sql
```

#### **2. Popular Domínio Padrão:**
```bash
node scripts/populate-default-domain.js
```

#### **3. Adicionar Novo Domínio (Farmácia):**
1. Acesse `/admin/email-domains`
2. Clique "Adicionar Domínio"
3. Preencha:
   - Nome: `farmacia-express.com`
   - Remetente: `Farmácia Express`
   - Email: `contato@farmacia-express.com`
   - Resposta: `suporte@farmacia-express.com`
   - API Key: `re_xxxxxxxxx`
4. Valide API Key e salve

#### **4. Usar em Campanha:**
1. Acesse `/admin/disparo-massa`
2. Upload dos leads
3. Configure oferta
4. **NOVO:** Selecione domínio no dropdown
5. Envie campanha

### 🎉 SISTEMA MULTI-DOMÍNIO OPERACIONAL!

**✅ COMPATIBILIDADE 100%**
**✅ SEGURANÇA MÁXIMA**
**✅ FLEXIBILIDADE TOTAL**
**✅ INTERFACE COMPLETA**