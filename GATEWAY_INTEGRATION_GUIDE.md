# Guia de Integração de Gateways de Pagamento

## Visão Geral

Este sistema oferece suporte a múltiplos gateways de pagamento através de uma arquitetura extensível baseada em registry pattern. O sistema foi projetado para ser flexível, permitindo a adição de novos gateways sem modificar o código existente.

## Arquitetura do Sistema

### Componentes Principais

#### 1. GatewayRegistry
- **Localização**: [`src/lib/gateways/GatewayRegistry.ts`](src/lib/gateways/GatewayRegistry.ts)
- **Função**: Gerencia o registro e instanciação de gateways
- **Padrão**: Singleton + Factory Pattern

#### 2. BaseGateway
- **Localização**: [`src/lib/gateways/BaseGateway.ts`](src/lib/gateways/BaseGateway.ts)
- **Função**: Classe base abstrata para todos os gateways
- **Recursos**: Logging, tratamento de erros, utilitários comuns

#### 3. PaymentGateway Interface
- **Localização**: [`src/types/gateway.ts`](src/types/gateway.ts)
- **Função**: Define o contrato padrão para todos os gateways

#### 4. ConfigValidator
- **Localização**: [`src/lib/gateways/ConfigValidator.ts`](src/lib/gateways/ConfigValidator.ts)
- **Função**: Valida configurações de gateways por tipo

#### 5. GatewayUtils
- **Localização**: [`src/lib/gateways/GatewayUtils.ts`](src/lib/gateways/GatewayUtils.ts)
- **Função**: Utilitários para normalização e conversão de dados

## Gateways Suportados

### 1. Asset (Asaas)
- **Tipo**: `asset`
- **Status**: ✅ Implementado e testado
- **Configuração**:
  ```json
  {
    "api_key": "admin_live_XXXXXXXXXXXXXXXXXXXXXXXXXX",
    "api_url": "https://api.asaas.com/v3",
    "webhook_secret": "your-webhook-secret",
    "sandbox": false
  }
  ```

### 2. Mercado Pago
- **Tipo**: `mercadopago`
- **Status**: 🚧 Schema preparado, implementação pendente
- **Configuração**:
  ```json
  {
    "access_token": "APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXX",
    "public_key": "APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXX",
    "webhook_secret": "your-webhook-secret",
    "sandbox_mode": false
  }
  ```

### 3. Stripe
- **Tipo**: `stripe`
- **Status**: 🚧 Schema preparado, implementação pendente
- **Configuração**:
  ```json
  {
    "secret_key": "YOUR_STRIPE_SECRET_KEY",
    "publishable_key": "YOUR_STRIPE_PUBLISHABLE_KEY",
    "webhook_secret": "YOUR_STRIPE_WEBHOOK_SECRET",
    "api_version": "2023-10-16"
  }
  ```

### 4. Pagar.me
- **Tipo**: `pagarme`
- **Status**: 🚧 Schema preparado, implementação pendente
- **Configuração**:
  ```json
  {
    "api_key": "ak_live_XXXXXXXXXXXXXXXXXXXXXXXXXX",
    "encryption_key": "ek_live_XXXXXXXXXXXXXXXXXXXXXXXXXX",
    "webhook_secret": "your-webhook-secret",
    "sandbox_mode": false
  }
  ```

## Como Integrar um Novo Gateway

### Passo 1: Definir Tipos TypeScript

Adicione os tipos específicos do gateway em [`src/types/gateway.ts`](src/types/gateway.ts):

```typescript
// Exemplo para um gateway hipotético "PayPal"
export interface PayPalConfig {
  client_id: string;
  client_secret: string;
  webhook_id: string;
  sandbox_mode?: boolean;
}

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: any;
  create_time: string;
}

// Adicionar aos tipos de união
export type GatewayConfig = AssetConfig | MercadoPagoConfig | StripeConfig | PayPalConfig;
export type WebhookEvent = AssetWebhookEvent | MercadoPagoWebhookEvent | StripeWebhookEvent | PayPalWebhookEvent;
```

### Passo 2: Criar a Implementação do Gateway

Crie um arquivo específico para o gateway em [`src/lib/gateways/`](src/lib/gateways/):

```typescript
// src/lib/gateways/PayPalGateway.ts
import { BaseGateway } from './BaseGateway';
import { PaymentGateway, PayPalConfig, PayPalWebhookEvent } from '../../types/gateway';

export class PayPalGateway extends BaseGateway implements PaymentGateway {
  private config: PayPalConfig;

  constructor(config: PayPalConfig) {
    super();
    this.config = config;
  }

  async processPayment(amount: number, currency: string, metadata?: any): Promise<any> {
    try {
      this.log('info', 'Processing PayPal payment', { amount, currency });
      
      // Implementar lógica de pagamento específica do PayPal
      // ...
      
      return { success: true, transaction_id: 'paypal_tx_123' };
    } catch (error) {
      this.handleError(error, 'PayPal payment processing failed');
      throw error;
    }
  }

  async processWebhook(event: PayPalWebhookEvent): Promise<any> {
    try {
      this.log('info', 'Processing PayPal webhook', { event_type: event.event_type });
      
      // Implementar lógica de webhook específica do PayPal
      // ...
      
      return { processed: true };
    } catch (error) {
      this.handleError(error, 'PayPal webhook processing failed');
      throw error;
    }
  }

  async validateWebhook(signature: string, payload: string): Promise<boolean> {
    // Implementar validação específica do PayPal
    return true;
  }
}
```

### Passo 3: Registrar o Gateway

Registre o gateway no [`GatewayRegistry`](src/lib/gateways/GatewayRegistry.ts):

```typescript
// Importar o gateway
import { PayPalGateway } from './PayPalGateway';

// Registrar no método setupRegistry
private setupRegistry(): void {
  // Gateways existentes...
  
  // Registrar PayPal
  this.registerGateway('paypal', (config) => new PayPalGateway(config));
}
```

### Passo 4: Adicionar Validação

Adicione o schema de validação em [`ConfigValidator.ts`](src/lib/gateways/ConfigValidator.ts):

```typescript
const VALIDATION_SCHEMAS = {
  // Schemas existentes...
  
  paypal: {
    required: ['client_id', 'client_secret', 'webhook_id'],
    optional: ['sandbox_mode'],
    validators: {
      client_id: (value: string) => value.startsWith('AX') || 'Client ID deve começar com AX',
      client_secret: (value: string) => value.length >= 32 || 'Client Secret deve ter pelo menos 32 caracteres'
    }
  }
};
```

### Passo 5: Configurar no Banco de Dados

Use o script [`setup-new-gateway.js`](scripts/setup-new-gateway.js) para adicionar o gateway:

```bash
# Modo interativo
node scripts/setup-new-gateway.js

# Modo linha de comando
node scripts/setup-new-gateway.js \
  --type=paypal \
  --client-id=cliente-uuid \
  --name="PayPal Production" \
  --config='{"client_id":"AX123...", "client_secret":"secret123...", "webhook_id":"webhook123..."}'
```

## Configuração do Banco de Dados

### Estrutura da Tabela `gateways`

```sql
CREATE TABLE gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Configuração Inicial

Execute o script SQL para criar a estrutura:

```bash
# Aplicar no Supabase ou PostgreSQL
psql -d your_database -f scripts/setup-database.sql
```

## Uso do Sistema

### 1. Obter Gateway Configurado

```typescript
import { getGatewayConfig } from '../lib/gateways/gatewaySelector';

const gatewayConfig = await getGatewayConfig(clientId, 'mercadopago');
if (gatewayConfig) {
  // Gateway configurado e pronto para uso
  console.log('Gateway:', gatewayConfig.name);
}
```

### 2. Processar Pagamento

```typescript
import { GatewayRegistry } from '../lib/gateways/GatewayRegistry';

const registry = GatewayRegistry.getInstance();
const gateway = registry.createGateway('mercadopago', config);

const result = await gateway.processPayment(100.00, 'BRL', {
  customer_id: 'customer_123',
  description: 'Pagamento teste'
});
```

### 3. Processar Webhook

```typescript
import { handleGenericWebhook } from '../webhook-server/handlers/genericWebhookHandler';

// O handler já está configurado para trabalhar com qualquer gateway registrado
const result = await handleGenericWebhook(request, response);
```

## Estrutura de Arquivos

```
src/
├── lib/
│   └── gateways/
│       ├── GatewayRegistry.ts      # Registry principal
│       ├── BaseGateway.ts          # Classe base
│       ├── ConfigValidator.ts      # Validador de configs
│       ├── GatewayUtils.ts         # Utilitários
│       ├── gatewaySelector.ts      # Seletor de gateways
│       ├── AssetGateway.ts         # Gateway Asset (existente)
│       ├── MercadoPagoGateway.ts   # Gateway Mercado Pago (criar)
│       ├── StripeGateway.ts        # Gateway Stripe (criar)
│       └── PayPalGateway.ts        # Gateway PayPal (exemplo)
├── types/
│   └── gateway.ts                  # Tipos TypeScript
├── config/
│   └── payment.ts                  # Configurações de pagamento
└── webhook-server/
    └── handlers/
        └── genericWebhookHandler.ts # Handler genérico
```

## Melhores Práticas

### 1. Tratamento de Erros
- Sempre use `try/catch` em métodos críticos
- Use `this.handleError()` da classe base para logging consistente
- Implemente retry logic quando apropriado

### 2. Logging
- Use `this.log()` da classe base para logging estruturado
- Inclua contexto relevante (IDs, valores, etc.)
- Defina níveis apropriados (info, warn, error)

### 3. Validação
- Valide todas as configurações no ConfigValidator
- Implemente validação de webhook signatures
- Valide dados de entrada nos métodos públicos

### 4. Testes
- Crie testes unitários para cada gateway
- Teste cenários de erro e recuperação
- Use mocks para APIs externas

### 5. Segurança
- Nunca logue informações sensíveis (tokens, secrets)
- Use variáveis de ambiente para configurações sensíveis
- Implemente validação robusta de webhooks

## Troubleshooting

### Erro: "Gateway type not registered"
- Verifique se o gateway foi registrado no GatewayRegistry
- Confirme que o tipo está correto (case-sensitive)

### Erro: "Invalid configuration"
- Verifique se todos os campos obrigatórios estão presentes
- Confira se os valores seguem o formato esperado
- Use o ConfigValidator para validar antes de usar

### Webhook não processando
- Verifique se o webhook signature é válido
- Confirme se o Content-Type está correto
- Verifique logs do servidor para erros específicos

## Suporte e Contribuição

### Reportar Bugs
- Use o sistema de issues do projeto
- Inclua logs relevantes e configuração (sem secrets)
- Descreva passos para reproduzir o problema

### Contribuir com Novos Gateways
1. Siga o padrão de implementação descrito neste guia
2. Adicione testes adequados
3. Atualize a documentação
4. Teste com dados reais em ambiente de sandbox

### Recursos Adicionais
- [Documentação da API Asset](https://docs.asaas.com/)
- [Documentação da API Mercado Pago](https://www.mercadopago.com.br/developers/)
- [Documentação da API Stripe](https://stripe.com/docs/api)
- [Documentação da API Pagar.me](https://docs.pagar.me/)

---

**Versão**: 1.0.0  
**Última Atualização**: 2024-01-01  
**Autor**: Sistema Multi-Gateway