# Credenciais de Acesso ao Sistema Multi-Gateway

## Configuração Concluída

Todas as configurações necessárias para o primeiro gateway foram concluídas com sucesso. Abaixo estão as credenciais de acesso e informações importantes.

## Credenciais de Administrador

Use estas credenciais para acessar o painel administrativo:

- **Email**: lucasadmi@gmail.com
- **Senha**: admin123
- **Papel**: admin
- **Cliente ID**: 747e0d51-609f-4102-9927-d3685edd83bf

## Credenciais de Usuário de Gateway

Use estas credenciais para acessar o painel específico do gateway Asset:

- **Email**: asset-user@rastreio.logfastexpress.com
- **Senha**: gateway123
- **Papel**: gateway_user
- **Cliente ID**: 747e0d51-609f-4102-9927-d3685edd83bf
- **Gateway ID**: 63b8c4fe-14ad-4c80-885f-08e0fb9eec1a
- **Tipo de Gateway**: asset

## Informações do Gateway Asset

O gateway Asset foi configurado com as seguintes informações:

- **API Key**: admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY
- **Webhook Secret**: 12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43
- **API URL**: https://api.asaas.com/v3
- **Webhook URL**: https://rastreio.logfastexpress.com/webhook/asset

## Como Acessar o Sistema

1. Inicie o servidor de desenvolvimento na porta 3001:
   ```
   # Windows
   start-dev.bat
   
   # Linux/Mac
   ./start-dev.sh
   
   # Ou diretamente com npm
   npm run dev:port
   ```

2. Acesse o sistema em seu navegador:
   ```
   http://localhost:3001
   ```

3. Faça login com as credenciais de administrador ou usuário de gateway.

**Nota**: É importante iniciar o servidor na porta 3001, pois essa é a porta configurada para o sistema. Se o servidor iniciar em outra porta, você pode ter problemas de redirecionamento.

## Solução de Problemas

Se você encontrar problemas de autenticação, verifique se:

1. Os arquivos `.env` e `.env.local` contêm as variáveis corretas do Supabase:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_SERVICE_ROLE_KEY`

2. O arquivo `src/lib/supabaseClient.ts` está usando as variáveis de ambiente corretamente.

3. As credenciais de usuário foram criadas corretamente no Supabase.

**Nota importante**: Para fins de desenvolvimento e teste, estamos usando a chave de serviço do Supabase para autenticação. Em um ambiente de produção, você deve usar a chave anônima para o cliente público e a chave de serviço apenas para operações administrativas.

## Rotas Disponíveis

- **Painel de Administrador**: `/admin`
- **Painel de Gateway**: `/gateway/dashboard`
- **Pedidos do Gateway**: `/gateway/orders`

## Segurança

As chaves JWT e de segurança foram configuradas no arquivo `.env`:

- **JWT_SECRET**: Chave segura gerada aleatoriamente
- **COOKIE_SECRET**: Chave segura gerada aleatoriamente
- **ASSET_WEBHOOK_SECRET**: Chave segura para validação de webhooks

## Próximos Passos

1. Teste o login com as credenciais de administrador e usuário de gateway
2. Verifique se as permissões estão funcionando corretamente
3. Configure webhooks no painel do Asset para apontar para a URL do seu sistema
4. Implemente os outros gateways (MercadoPago, PagarMe) quando necessário