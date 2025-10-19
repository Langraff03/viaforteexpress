# Variáveis de Ambiente para Railway - ViaForte Express

## 📋 Lista Completa de Variáveis Necessárias

### Supabase (Banco de Dados)
```
SUPABASE_URL=https://kbcaltiiworfgdqocofu.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2FsdGlpd29yZmdkcW9jb2Z1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM1NDA4MSwiZXhwIjoyMDY0OTMwMDgxfQ.DpsIBE9g4BSFHIkijb4NAP5F5bhMxpuiDwxZDP5FkH0
```

### Resend (Email Service)
```
RESEND_API_KEY=re_78hroTL4_CYHTro5w8iC4vc5pDThoVESB
```

### Asset Gateway (Pagamentos)
```
ASSET_API_KEY=admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY
ASSET_WEBHOOK_SECRET=12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43
```

### Configuração de Email
```
FROM_EMAIL=contato@viaforteexpress.com
FROM_NAME=VIA FORTE EXPRESS
SUPPORT_EMAIL=suporte@viaforteexpress.com
```

### Segurança (Gerar novos valores aleatórios)
```
JWT_SECRET=gerar_novo_valor_aleatorio_base64_32_bytes
COOKIE_SECRET=gerar_novo_valor_aleatorio_base64_32_bytes
```

### Fuso Horário
```
TZ=America/Sao_Paulo
```

## 🚀 Comandos para Configurar no Railway CLI

### 1. Supabase
```bash
railway variables set SUPABASE_URL="https://kbcaltiiworfgdqocofu.supabase.co"
railway variables set SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiY2FsdGlpd29yZmdkcW9jb2Z1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTM1NDA4MSwiZXhwIjoyMDY0OTMwMDgxfQ.DpsIBE9g4BSFHIkijb4NAP5F5bhMxpuiDwxZDP5FkH0"
```

### 2. Resend
```bash
railway variables set RESEND_API_KEY="re_78hroTL4_CYHTro5w8iC4vc5pDThoVESB"
```

### 3. Asset Gateway
```bash
railway variables set ASSET_API_KEY="admin_live_0JqhhCVNXuTwzhfQHiiFbYpUT7YyDNI35rY"
railway variables set ASSET_WEBHOOK_SECRET="12b81c3b01e40506bef7c583f757fe9e4a028920ca3cf178530c94fbfb4ceb43"
```

### 4. Email Configuration
```bash
railway variables set FROM_EMAIL="contato@viaforteexpress.com"
railway variables set FROM_NAME="VIA FORTE EXPRESS"
railway variables set SUPPORT_EMAIL="suporte@viaforteexpress.com"
```

### 5. Segurança (Gerar valores aleatórios)
```bash
# Gerar JWT_SECRET (32 bytes em base64)
railway variables set JWT_SECRET="$(openssl rand -base64 32)"

# Gerar COOKIE_SECRET (32 bytes em base64)
railway variables set COOKIE_SECRET="$(openssl rand -base64 32)"
```

### 6. Fuso Horário
```bash
railway variables set TZ="America/Sao_Paulo"
```

## 📝 Instruções para Uso

1. **Copie cada comando acima** e execute no terminal
2. **Para JWT_SECRET e COOKIE_SECRET**, use os comandos com `openssl` para gerar valores seguros
3. **Verifique se todas as variáveis foram configuradas** com:
   ```bash
   railway variables list
   ```
4. **Após configurar todas as variáveis**, reinicie o deploy:
   ```bash
   railway up
   ```

## ⚠️ Importante

- **Redis**: Será configurado automaticamente pelo Railway quando você executar `railway add redis`
- **APP_URL**: Será atualizada automaticamente com a URL do Railway após o primeiro deploy bem-sucedido
- **Valores sensíveis**: Nunca commite estes valores no código. Use sempre variáveis de ambiente.

## 🔍 Verificação

Após configurar tudo, verifique os logs:
```bash
railway logs
```

E teste a saúde dos serviços:
```bash
curl https://your-railway-url.up.railway.app/webhook/health