# GUIA: OPÇÕES DE DOMÍNIOS DE EMAIL PARA OFERTAS

## 🎯 ESTRATÉGIAS DISPONÍVEIS

### 🔴 **OPÇÃO 1: Domínios Completamente Separados (MAIS CARA)**

**Como funciona:**
- Comprar domínio para cada nicho
- Verificar cada domínio no Resend
- Configurar DNS para cada um

**Exemplos:**
- `farmacia-express.com` - Farmácia Express <contato@farmacia-express.com>
- `imoveis-express.com` - Imóveis Express <vendas@imoveis-express.com>  
- `tech-express.com` - Tech Express <contato@tech-express.com>

**Custos:**
- ~R$ 50-80/ano por domínio
- Verificação DNS individual
- API keys separadas (opcional)

**Vantagens:**
- Credibilidade máxima
- Branding específico por nicho
- Isolamento total

---

### 🟡 **OPÇÃO 2: Subdomínios do Mesmo Domínio (EQUILIBRADA)**

**Como funciona:**
- Usar apenas `express-leads.com` (exemplo)
- Criar subdomínios: farmacia.express-leads.com, imoveis.express-leads.com
- Verificar apenas o domínio principal no Resend

**Exemplos:**
- `farmacia.express-leads.com` - Farmácia Express <contato@farmacia.express-leads.com>
- `imoveis.express-leads.com` - Imóveis Express <vendas@imoveis.express-leads.com>
- `tech.express-leads.com` - Tech Express <contato@tech.express-leads.com>

**Custos:**
- ~R$ 50-80/ano (apenas 1 domínio)
- Verificação DNS uma vez só
- Mesma API key para todos

**Vantagens:**
- Economia significativa
- Gerenciamento simples
- Branding diferenciado

---

### 🟢 **OPÇÃO 3: Mesmo Domínio, Nomes Diferentes (MAIS BARATA)**

**Como funciona:**
- Usar apenas `frotaexpress.com` 
- Variar o nome do remetente
- Usar emails diferentes no mesmo domínio

**Exemplos:**
- `Farmácia Express <farmacia@frotaexpress.com>`
- `Imóveis Express <imoveis@frotaexpress.com>`
- `Tech Express <tecnologia@frotaexpress.com>`

**Custos:**
- R$ 0 (usar domínio atual)
- Sem verificação adicional
- Mesma API key

**Vantagens:**
- Economia máxima
- Setup imediato
- Confiança do domínio atual

---

## 🔧 IMPLEMENTAÇÃO PRÁTICA

### **Para OPÇÃO 1 (Domínios Separados):**
```javascript
// No sistema implementado:
{
  domain_name: 'farmacia-express.com',
  from_name: 'Farmácia Express',
  from_email: 'contato@farmacia-express.com',
  resend_api_key: 're_farmacia_xxx' // Pode ser a mesma
}
```

### **Para OPÇÃO 2 (Subdomínios):**
```javascript
// No sistema implementado:
{
  domain_name: 'farmacia.express-leads.com',
  from_name: 'Farmácia Express',
  from_email: 'contato@farmacia.express-leads.com',
  resend_api_key: 're_expressleads_xxx' // Mesma para todos
}
```

### **Para OPÇÃO 3 (Mesmo Domínio):**
```javascript
// No sistema implementado:
{
  domain_name: 'frotaexpress.com',
  from_name: 'Farmácia Express',
  from_email: 'farmacia@frotaexpress.com',
  resend_api_key: 're_frotaexpress_xxx' // Mesma atual
}
```

## 💰 RECOMENDAÇÃO POR ORÇAMENTO

### **💸 Orçamento Baixo → OPÇÃO 3**
- Usar frotaexpress.com atual
- Criar emails: farmacia@, imoveis@, tech@
- Variar apenas o nome do remetente

### **💵 Orçamento Médio → OPÇÃO 2** 
- Comprar 1 domínio: `express-leads.com`
- Subdomínios ilimitados grátis
- Máximo ROI

### **💰 Orçamento Alto → OPÇÃO 1**
- Domínio dedicado por nicho
- Credibilidade máxima
- Investimento em branding

## 🎯 QUAL USAR PARA COMEÇAR?

**RECOMENDAÇÃO INTELIGENTE:**

1. **Comece com OPÇÃO 3** (mesmo domínio, nomes diferentes)
2. **Valide as campanhas** e veja o retorno
3. **Se der bom resultado**, migre para OPÇÃO 2 ou 1
4. **Teste A/B** entre os domínios

## ⚡ IMPLEMENTAÇÃO IMEDIATA

Para começar hoje mesmo com **CUSTO ZERO**:

```javascript
// Adicionar no /admin/email-domains:

// Farmácia
{
  domain_name: 'frotaexpress.com',
  from_name: 'Farmácia Express',
  from_email: 'farmacia@frotaexpress.com',
  reply_to_email: 'suporte@frotaexpress.com',
  resend_api_key: 'sua_api_key_atual'
}

// Imóveis  
{
  domain_name: 'frotaexpress.com',
  from_name: 'Imóveis Express',
  from_email: 'imoveis@frotaexpress.com', 
  reply_to_email: 'suporte@frotaexpress.com',
  resend_api_key: 'sua_api_key_atual'
}
```

**RESULTADO:**
- ✅ Custos: R$ 0
- ✅ Setup: 5 minutos
- ✅ Funcionamento: Imediato
- ✅ Branding: Diferenciado por nome

O sistema implementado suporta **TODAS AS 3 OPÇÕES!** Você pode começar barato e evoluir conforme necessário.