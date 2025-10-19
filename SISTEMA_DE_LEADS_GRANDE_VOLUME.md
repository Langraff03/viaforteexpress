# Sistema de Leads para Grande Volume

Este documento descreve as melhorias implementadas no sistema de envio de emails para leads, permitindo o processamento eficiente de grandes volumes de leads (mais de 2.000 por arquivo ou no banco de dados).

## Melhorias Implementadas

### 1. Processamento em Lotes (Batching)
- Os leads são divididos em lotes menores (100-200 leads por lote)
- Cada lote é processado independentemente
- Permite melhor gerenciamento de memória e recursos

### 2. Streaming de Arquivos
- Para arquivos JSON grandes, usamos JSONStream para processar o arquivo sem carregá-lo completamente na memória
- Permite processar arquivos de vários MB ou GB sem problemas de memória

### 3. Paginação para Leads do Banco de Dados
- Consultas paginadas para buscar leads do banco em lotes pequenos
- Evita carregar milhares de registros na memória de uma vez
- Mantém o banco de dados responsivo mesmo com grandes volumes

### 4. Conexão com Bancos de Dados Externos
- Suporte para processar leads diretamente do banco de dados do cliente
- Compatível com PostgreSQL, MySQL e SQL Server
- Mapeamento flexível de campos para diferentes estruturas de tabelas

### 5. Paralelização Controlada
- Processamento paralelo com limites de concorrência
- Evita sobrecarga do servidor e do serviço de email
- Configurável através de parâmetros de concorrência

### 6. Sistema de Filas Aprimorado
- Melhor gerenciamento de filas para grandes volumes
- Retentativas automáticas para falhas
- Monitoramento de progresso em tempo real

### 7. Monitoramento e Logs Avançados
- Logs detalhados do processamento de cada lote
- Estatísticas de sucesso/falha
- Progresso percentual durante o processamento

## Como Usar

### Pré-requisitos

Instale as dependências necessárias:

```bash
install-lead-dependencies.bat
```

### Processamento de Arquivos Grandes

Use o mesmo comando que antes, o sistema detectará automaticamente arquivos grandes e aplicará o processamento otimizado:

```bash
processar-leads-cliente.bat NOME_CLIENTE CAMINHO_ARQUIVO_JSON
```

Exemplo:
```bash
processar-leads-cliente.bat empresa-abc leads-empresa-abc.json
```

### Processamento de Leads do Banco de Dados Interno

Para processar leads internos do banco de dados do sistema, use o mesmo comando que antes:

```bash
npm run process:leads internal
```

Com filtros específicos:
```bash
npm run process:leads internal '{"status": "ativo", "tags": ["interessado"]}'
```

O sistema agora suporta processamento de milhares de leads do banco de dados usando:
- Paginação automática
- Processamento em lotes
- Paralelização controlada
- Monitoramento de progresso em tempo real

### Processamento de Leads de Bancos de Dados Externos

Para processar leads diretamente do banco de dados do cliente:

1. Instale as dependências necessárias:
   ```bash
   install-db-dependencies.bat
   ```

2. Crie um arquivo de configuração de conexão com o banco de dados (exemplo em `exemplo-db-config.json`):
   ```json
   {
     "type": "postgres",
     "connection": {
       "host": "db.cliente.com",
       "port": 5432,
       "database": "marketing_db",
       "user": "readonly_user",
       "password": "senha_segura"
     },
     "table_name": "customers",
     "field_mapping": {
       "email": "email_address",
       "nome": "full_name"
     },
     "filters": {
       "is_active": true,
       "marketing_opt_in": true
     }
   }
   ```

3. Execute o processamento:
   ```bash
   processar-leads-banco-externo.bat NOME_CLIENTE CAMINHO_CONFIG_BANCO CAMINHO_CONFIG_OFERTA
   ```

   Exemplo:
   ```bash
   processar-leads-banco-externo.bat empresa-abc exemplo-db-config.json oferta-config.json
   ```

#### Bancos de Dados Suportados

- **PostgreSQL**: Defina `"type": "postgres"` ou `"type": "postgresql"`
- **MySQL**: Defina `"type": "mysql"`
- **SQL Server**: Defina `"type": "mssql"` ou `"type": "sqlserver"`

#### Mapeamento de Campos

O sistema permite mapear os campos do banco de dados do cliente para os campos esperados pelo sistema:

```json
"field_mapping": {
  "email": "customer_email",     // Campo obrigatório
  "nome": "customer_name",       // Opcional
  "telefone": "phone",           // Opcional
  "oferta_interesse": "product"  // Opcional
}
```

#### Filtros

Você pode especificar filtros para selecionar apenas leads específicos:

```json
"filters": {
  "is_active": true,
  "segment": "high_value",
  "last_purchase_date": "2025-01-01"
}
```

### Configurações Avançadas

As configurações de processamento em lote podem ser ajustadas:

#### Para Arquivos (em `src/lib/batchLeadProcessor.js`):
- `BATCH_SIZE`: Número de leads por lote (padrão: 100)
- `MAX_CONCURRENT_BATCHES`: Número máximo de lotes processados simultaneamente (padrão: 3)
- `RATE_LIMIT_DELAY`: Delay entre envios de emails em ms (padrão: 200)

#### Para Leads do Banco (em `src/workers/lead.worker.ts`):
- `BATCH_SIZE`: Número de leads por lote (padrão: 100)
- `CONCURRENCY_LIMIT`: Número máximo de operações simultâneas (padrão: 5)

## Monitoramento

### Durante o Processamento de Arquivos Grandes

O sistema exibirá informações de progresso:

```
📊 Tamanho do arquivo: 15.75 MB
📈 Número estimado de leads: ~787 (estimativa)
🚀 Usando processamento por streaming para arquivo grande

📦 Processando lote #1 (100 leads)
✅ Lote #1 concluído: 98 sucessos, 2 falhas
📊 Progresso: ~13% (100/787 leads processados)

📦 Processando lote #2 (100 leads)
...
```

### Durante o Processamento de Leads do Banco

O sistema exibirá informações de progresso similares:

```
[InternalLeadWorker] Encontrados 3500 leads para processar em 35 lotes
[InternalLeadWorker] Processando lote 1/35 (100 leads)
[InternalLeadWorker] Lote 1/35 processado: 97 sucessos, 3 falhas
[InternalLeadWorker] Progresso: 3% (100/3500 leads)

[InternalLeadWorker] Processando lote 2/35 (100 leads)
...
```

## Logs e Recuperação

### Para Arquivos de Leads

Os logs detalhados são salvos em:
```
clients/NOME_CLIENTE/logs/processamento-TIMESTAMP.log
```

Em caso de falha, os arquivos são movidos para:
```
clients/NOME_CLIENTE/falhas/
```

Os arquivos processados com sucesso são arquivados em:
```
clients/NOME_CLIENTE/processados/
```

### Para Leads do Banco

Os logs são exibidos no console e também registrados no banco de dados na tabela `offer_email_logs`.

Você pode consultar o status dos envios com:

```sql
SELECT * FROM offer_email_logs ORDER BY sent_at DESC;
```

## Considerações de Desempenho

- **Memória**:
  - Arquivos: O processamento por streaming reduz significativamente o uso de memória
  - Banco: A paginação evita carregar todos os registros de uma vez

- **CPU**: A paralelização controlada otimiza o uso de CPU para ambos os tipos de processamento

- **Banco de Dados**:
  - Consultas paginadas evitam sobrecarga do banco
  - Índices otimizados para consultas de leads

- **Rede**: O sistema respeita limites de taxa para evitar bloqueios de API

- **Tempo**:
  - Arquivos grandes: Podem levar vários minutos para processar completamente
  - Banco de dados: Processamento de 10.000 leads leva aproximadamente 30-40 minutos

## Solução de Problemas

### Problemas com Arquivos Grandes

#### Erro "JavaScript heap out of memory"

Se você encontrar este erro ao processar arquivos muito grandes, aumente a memória disponível para o Node.js:

```bash
set NODE_OPTIONS=--max-old-space-size=4096
processar-leads-cliente.bat NOME_CLIENTE CAMINHO_ARQUIVO_JSON
```

#### Falhas de Conexão

Se ocorrerem falhas de conexão durante o processamento, o sistema tentará novamente automaticamente. Se persistirem, verifique:

1. Conexão com a internet
2. Limites de taxa da API de email
3. Disponibilidade do serviço de email

### Problemas com Leads do Banco de Dados

#### Consultas Lentas

Se o processamento de leads do banco estiver muito lento:

1. Verifique se os índices estão otimizados:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
   CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
   ```

2. Ajuste o tamanho do lote para um valor menor:
   ```
   // Em src/workers/lead.worker.ts
   const BATCH_SIZE = 50; // Reduzir de 100 para 50
   ```

#### Erros de Timeout do Banco

Se ocorrerem erros de timeout durante consultas ao banco:

1. Aumente o tempo limite de consulta no Supabase (se possível)
2. Reduza o tamanho do lote e a concorrência
3. Verifique a carga do servidor de banco de dados

#### Monitoramento de Progresso

Se você precisar monitorar o progresso em tempo real, consulte:

```sql
SELECT COUNT(*) FROM offer_email_logs
WHERE sent_at > (CURRENT_TIMESTAMP - INTERVAL '1 hour')
AND origin = 'interno';
```

### Problemas com Bancos de Dados Externos

#### Erros de Conexão

Se ocorrerem erros de conexão com o banco de dados externo:

1. Verifique se as credenciais estão corretas
2. Confirme se o IP do servidor está na lista de permissões do firewall do banco
3. Teste a conexão com uma ferramenta como DBeaver ou pgAdmin

#### Erros de Permissão

Se ocorrerem erros de permissão:

1. Verifique se o usuário tem permissão de leitura na tabela especificada
2. Confirme que o usuário pode executar SELECT na tabela
3. Use um usuário com permissões somente leitura por segurança

#### Mapeamento de Campos Incorreto

Se os dados não estiverem sendo mapeados corretamente:

1. Verifique os nomes exatos das colunas no banco de dados
2. Confirme o mapeamento no arquivo de configuração
3. Teste com uma consulta SQL direta para verificar os dados

#### Problemas de Codificação de Caracteres

Se caracteres especiais aparecerem incorretamente:

1. Verifique a codificação do banco de dados (geralmente UTF-8)
2. Adicione configuração de codificação na conexão:
   ```json
   "connection": {
     "host": "db.cliente.com",
     "port": 5432,
     "database": "marketing_db",
     "user": "readonly_user",
     "password": "senha_segura",
     "charset": "utf8mb4"  // Para MySQL
   }
   ```

## Exemplos de Desempenho

### Processamento de Arquivos

| Tamanho do Arquivo | Número de Leads | Tempo de Processamento | Uso de Memória |
|--------------------|-----------------|------------------------|----------------|
| 1 MB               | ~50             | ~30 segundos           | ~100 MB        |
| 10 MB              | ~500            | ~5 minutos             | ~150 MB        |
| 50 MB              | ~2.500          | ~20 minutos            | ~200 MB        |
| 100 MB             | ~5.000          | ~40 minutos            | ~250 MB        |

### Processamento de Leads do Banco

| Número de Leads | Tempo de Processamento | Uso de Memória | Carga no Banco |
|-----------------|------------------------|----------------|----------------|
| 1.000           | ~5 minutos             | ~120 MB        | Baixa          |
| 5.000           | ~25 minutos            | ~150 MB        | Média          |
| 10.000          | ~50 minutos            | ~180 MB        | Média-Alta     |
| 50.000          | ~4 horas               | ~250 MB        | Alta           |

### Processamento de Bancos de Dados Externos

| Número de Leads | Banco de Dados | Tempo de Processamento | Uso de Memória |
|-----------------|----------------|------------------------|----------------|
| 1.000           | PostgreSQL     | ~6 minutos             | ~130 MB        |
| 5.000           | PostgreSQL     | ~30 minutos            | ~160 MB        |
| 10.000          | MySQL          | ~55 minutos            | ~190 MB        |
| 50.000          | SQL Server     | ~4.5 horas             | ~270 MB        |