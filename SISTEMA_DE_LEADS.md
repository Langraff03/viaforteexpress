# Sistema de Envio de Emails para Leads

Este documento descreve o novo sistema de envio de emails para leads, que permite enviar emails de oferta tanto para leads internos (cadastrados no banco de dados) quanto para leads externos (enviados por clientes).

## Funcionalidades Implementadas

1. **Envio de emails para leads internos e externos**
   - Suporte para leads do banco de dados
   - Suporte para leads de arquivos JSON/CSV enviados por clientes

2. **Templates de email personalizáveis**
   - Template React para emails de oferta
   - Personalização com nome do lead, descrição da oferta, links, etc.

3. **Sistema de filas para processamento assíncrono**
   - Processamento em lote de leads
   - Enfileiramento de emails para envio

4. **Registro de logs e monitoramento**
   - Logs de emails enviados
   - Registro de uploads de arquivos de leads
   - Registro de processamento de lotes

## Estrutura do Sistema

### Componentes Principais

- **Templates de Email**: `src/emails/OfferEmail.tsx`
- **Serviço de Email**: `src/lib/emailService.tsx`
- **Sistema de Filas**: `src/lib/queue.ts`
- **Workers**: `src/workers/lead.worker.ts`
- **Scripts de Processamento**: `src/scripts/process-leads.ts` e `src/scripts/test-lead-email.ts`
- **Banco de Dados**: Tabelas para leads, ofertas, logs, etc.

### Fluxo de Funcionamento

1. **Coleta de Leads**:
   - Leads internos são recuperados do banco de dados
   - Leads externos são carregados de arquivos JSON/CSV

2. **Processamento de Leads**:
   - Os leads são validados (email válido, etc.)
   - São enfileirados para envio de email

3. **Envio de Emails**:
   - Os emails são enviados usando o serviço Resend
   - São personalizados com os dados do lead e da oferta

4. **Registro de Logs**:
   - Os envios são registrados no banco de dados
   - Erros são capturados e registrados

## Como Usar

### Configuração Inicial

1. **Configurar o banco de dados**:
   
   **Opção 1**: Usando Supabase CLI (se o Supabase local estiver configurado):
   ```bash
   npx supabase migration up
   ```
   
   **Opção 2**: Aplicação manual do SQL (se encontrar erros de conexão com Supabase local):
   
   a) Copie o conteúdo do arquivo `supabase/migrations/20250606004500_add_leads_system.sql`
   
   b) Execute o SQL diretamente no banco de dados usando o console SQL do Supabase Studio ou outra ferramenta de administração
   
   c) Alternativamente, use o script auxiliar:
   ```bash
   node run-sql-scripts.js supabase/migrations/20250606004500_add_leads_system.sql
   ```

2. **Instalar dependências**:
   ```bash
   npm install csv-parse
   ```

### Processamento de Leads Internos

Para processar leads internos do banco de dados:

```bash
npm run process:leads internal
```

Com filtros específicos:

```bash
npm run process:leads internal '{"status": "ativo", "tags": ["interessado"]}'
```

### Processamento de Leads Externos (de arquivos)

Para processar leads de um arquivo CSV:

```bash
npm run process:leads csv ./caminho/para/arquivo.csv cliente-id '{"oferta_nome":"Oferta Especial","desconto":"15%","link_da_oferta":"https://exemplo.com/oferta","descricao_adicional":"Descrição da oferta"}'
```

Para processar leads de um arquivo JSON:

```bash
npm run process:leads json ./caminho/para/arquivo.json cliente-id '{"oferta_nome":"Oferta Especial","desconto":"15%","link_da_oferta":"https://exemplo.com/oferta","descricao_adicional":"Descrição da oferta"}'
```

### Teste de Envio de Email

Para testar o envio direto de um email:

```bash
npm run test:lead-email direct
```

Para testar o enfileiramento de um email:

```bash
npm run test:lead-email queue
```

Para testar o processamento em lote:

```bash
npm run test:lead-email batch
```

### Iniciar Workers

Para iniciar os workers de processamento de leads:

```bash
npm run dev:lead
```

Ou para iniciar todos os workers:

```bash
npm run devall
```

## Formato dos Arquivos de Leads

### Formato JSON

```json
[
  {
    "email": "lead1@cliente.com",
    "nome": "Lead 1",
    "oferta_interesse": "Produto A"
  },
  {
    "email": "lead2@cliente.com",
    "nome": "Lead 2",
    "oferta_interesse": "Produto B"
  }
]
```

### Formato CSV

```
email,nome,oferta_interesse
lead1@cliente.com,Lead 1,Produto A
lead2@cliente.com,Lead 2,Produto B
```

## Monitoramento e Logs

Os logs de envio de emails para leads são armazenados na tabela `offer_email_logs`. Você pode consultar esta tabela para verificar o status dos envios:

```sql
SELECT * FROM offer_email_logs ORDER BY sent_at DESC;
```

Os uploads de arquivos de leads são registrados na tabela `lead_file_uploads`:

```sql
SELECT * FROM lead_file_uploads ORDER BY uploaded_at DESC;
```

Os lotes de processamento de leads externos são registrados na tabela `external_lead_batches`:

```sql
SELECT * FROM external_lead_batches ORDER BY processed_at DESC;
```

## Considerações de Segurança e Privacidade

- O sistema respeita as leis de proteção de dados (LGPD/GDPR)
- Os emails incluem opção de cancelamento de inscrição
- Os dados dos leads são armazenados de forma segura
- As políticas de RLS garantem que apenas usuários autorizados possam acessar os dados

## Próximos Passos e Melhorias Futuras

- Implementar sistema de agendamento para envios programados
- Adicionar análise de métricas de abertura e clique
- Criar interface de usuário para gerenciamento de leads e campanhas
- Implementar segmentação avançada de leads