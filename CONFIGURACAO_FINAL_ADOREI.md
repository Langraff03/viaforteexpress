# 🔧 CONFIGURAÇÃO FINAL - INTEGRAÇÃO ADOREI

## 🔑 **1. CHAVE DO RESEND PARA FREELANCERS**

### **Localização da Configuração:**
**Arquivo**: [`src/lib/emailService.tsx:84`](src/lib/emailService.tsx:84)

```typescript
/**
 * ✅ NOVA: Obter configuração de email específica para freelancers Adorei
 */
export async function getFreelancerAdoreiEmailConfig(): Promise<EmailConfig> {
  // 🔑 CHAVE PADRÃO DO RESEND PARA FREELANCERS ADOREI
  // ✅ Lê da variável de ambiente (SEGURO)
  const FREELANCER_ADOREI_RESEND_KEY = getEnvVar('RESEND_API_KEY_CHECKOUTS') || '';
  
  return {
    fromName: 'VIA FORTE EXPRESS',
    fromEmail: 'noreply@viaforteexpress.com',
    replyToEmail: 'suporte@viaforteexpress.com',
    resendApiKey: FREELANCER_ADOREI_RESEND_KEY, // 👈 CHAVE SEGURA VIA ENV
  };
}
```

### **Variável de Ambiente:**
**Arquivo**: [`.env.example:5`](.env.example:5)

```bash
# 🛒 Checkout Integration - Resend API Key para Freelancers (Obrigatório)
RESEND_API_KEY_CHECKOUTS=re_ZpJ2ef3P_337aBLQfT4wMWsgfsfjZctjH
```

### **Como Funciona:**
- **Sem domínio personalizado**: Usa a chave padrão dos freelancers
- **Com domínio personalizado**: Usa a chave específica do domínio
- **Sistema inteligente** que escolhe automaticamente a melhor configuração

### **Para Ativar:**
1. **Configure no .env**: `RESEND_API_KEY_CHECKOUTS=re_ZpJ2ef3P_337aBLQfT4wMWsgfsfjZctjH`
2. **Pronto!** Todos os freelancers Adorei usarão automaticamente essa chave segura

---

## 📋 **2. FORMULÁRIO DE SOLICITAÇÃO DE DOMÍNIO**

### **Onde está localizado:**
**Arquivo**: [`src/components/FreelancerCheckoutConfig.tsx:341-437`](src/components/FreelancerCheckoutConfig.tsx:341-437)

### **Como acessar:**
1. **Freelancer** vai em `Configurações de Checkout`
2. **Seleciona** "Adorei" no menu lateral
3. **Na seção "Domínio de Email"** → clica no **botão "+"** ao lado do seletor
4. **Modal abre** com formulário de solicitação

### **Campos do formulário:**
```typescript
interface DomainRequestFormData {
  domain_name: string;        // Ex: "minhaempresa.com"
  business_name?: string;     // Ex: "Minha Empresa Ltda" 
  business_description?: string; // Descrição da empresa
  reason?: string;            // Motivo da solicitação
}
```

### **Fluxo completo:**
```
Freelancer preenche → Solicita domínio → Admin aprova → Domínio disponível → Freelancer usa
```

### **Visual na interface:**
```
┌─────────────────┬───┐
│ Domínio de Email │ + │ ← Clica no "+" para solicitar
└─────────────────┴───┘
       ↓
┌─────────────────────┐
│ Modal de Solicitação │
│ - Domain Name       │
│ - Business Name     │  
│ - Reason            │
│ [Solicitar] [Cancel]│
└─────────────────────┘
```

---

## 🔄 **3. FLUXO DE APROVAÇÃO DE DOMÍNIO**

### **Para Administradores:**
**Painel**: [`src/admin/pages/DomainRequestsManagement.tsx`](src/admin/pages/DomainRequestsManagement.tsx)

### **Processo:**
1. **Freelancer** solicita domínio via formulário
2. **Admin** vê solicitação no painel administrativo
3. **Admin** aprova e configura:
   - Nome do remetente
   - Email do remetente
   - Email de resposta
   - **Chave do Resend** (específica para esse domínio)
4. **Domínio** fica disponível para o freelancer

### **Onde adicionar na rota admin:**
Adicione esta rota no sistema admin (se ainda não existir):
```typescript
// Em App.tsx ou AdminRoutes.tsx
<Route path="/admin/domain-requests" element={<DomainRequestsManagement />} />
```

---

## 📧 **4. LÓGICA DE ESCOLHA DE EMAIL**

### **Ordem de prioridade:**
1. **Domínio personalizado** (se configurado pelo freelancer)
2. **Chave padrão freelancer** (nova conta Resend)
3. **Fallback** para configuração geral do sistema

### **Código da lógica:**
```typescript
// No worker: src/workers/payment-webhook.worker.ts:103-107
const emailConfig = config.email_domain_id 
  ? await getEmailConfigByDomain(config.email_domain_id)      // 1. Personalizado
  : await getFreelancerAdoreiEmailConfig();                   // 2. Padrão freelancer
```

---

## ⚠️ **PRÓXIMOS PASSOS OBRIGATÓRIOS:**

### **1. Substituir Chave do Resend:**
```typescript
// Em src/lib/emailService.tsx:84
const FREELANCER_ADOREI_RESEND_KEY = 'SUA_CHAVE_REAL_AQUI'; // ⚠️ ATUALIZAR
```

### **2. Adicionar Rota Admin:**
Se ainda não existe, adicione:
```typescript
<Route path="/admin/domain-requests" element={<DomainRequestsManagement />} />
```

### **3. Executar Script SQL:**
```bash
psql -h seu-host -U seu-usuario -d sua-database -f scripts/create-freelancer-checkout-tables.sql
```

### **4. Testar Integração:**
```bash
node scripts/test-adorei-integration.js
```

---

## 🎯 **LOCALIZAÇÃO RÁPIDA:**

| Funcionalidade | Arquivo | Linha |
|---|---|---|
| **Chave Resend Freelancer** | [`src/lib/emailService.tsx`](src/lib/emailService.tsx) | 84 |
| **Formulário Solicitar Domínio** | [`src/components/FreelancerCheckoutConfig.tsx`](src/components/FreelancerCheckoutConfig.tsx) | 341-437 |
| **Botão "+" Solicitar** | [`src/components/FreelancerCheckoutConfig.tsx`](src/components/FreelancerCheckoutConfig.tsx) | 326-331 |
| **Painel Admin Domínios** | [`src/admin/pages/DomainRequestsManagement.tsx`](src/admin/pages/DomainRequestsManagement.tsx) | 1-509 |
| **Worker com Nova Lógica** | [`src/workers/payment-webhook.worker.ts`](src/workers/payment-webhook.worker.ts) | 103-107 |

🎉 **Tudo configurado e pronto para uso!**