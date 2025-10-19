# 🎯 GUIA PASSO-A-PASSO FINAL - Correção Nota Fiscal

## 🔍 Situação Atual
- ✅ Frontend hospedado no **Netlify**
- ✅ Backend rodando no seu **computador local** (localhost:3001)
- ❌ Frontend não consegue acessar backend local
- ✅ Código já foi modificado para usar variável de ambiente

## 📋 Passos para Resolver

### Passo 1: Expor Backend com ngrok
```bash
# Execute o script criado:
setup-ngrok.bat

# OU manualmente:
npm install -g ngrok
ngrok http 3001
```

**Resultado:** Você verá algo como:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3001
```

### Passo 2: Copiar URL do ngrok
- Copie a URL HTTPS (ex: `https://abc123.ngrok.io`)
- **IMPORTANTE:** Use apenas a URL HTTPS, não HTTP

### Passo 3: Configurar Variável no Netlify
1. Acesse **Netlify Dashboard**
2. Vá em **Site Settings**
3. Clique em **Environment Variables**
4. Clique em **Add Variable**
5. Configure:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://abc123.ngrok.io/api` (sua URL + /api)
6. Clique em **Save**

### Passo 4: Rebuild no Netlify
1. Vá em **Deploys**
2. Clique em **Trigger deploy**
3. Selecione **Deploy site**
4. Aguarde o deploy terminar

### Passo 5: Testar
1. Envie um email de rastreamento
2. Clique no botão **"Ver Nota Fiscal"**
3. ✅ Deve funcionar sem erro!

## 🎯 Como Funciona

### Antes (Com Erro):
```
Frontend Netlify → fetch('/api/invoice/ID')
→ ❌ Netlify não tem backend
→ ❌ Retorna HTML 404
→ ❌ JSON.parse() falha
```

### Depois (Funcionando):
```
Frontend Netlify → fetch('https://abc123.ngrok.io/api/invoice/ID')
→ ✅ ngrok redireciona para localhost:3001
→ ✅ Backend retorna JSON
→ ✅ Nota fiscal exibida
```

## 🚨 Pontos Importantes

### ⚠️ Mantenha ngrok Rodando
- O ngrok precisa estar ativo para funcionar
- Se fechar, a nota fiscal para de funcionar
- Para reiniciar: execute `setup-ngrok.bat` novamente

### ⚠️ URL Muda ao Reiniciar
- Toda vez que reiniciar ngrok, a URL muda
- Você precisará atualizar a variável no Netlify
- Para URL fixa: configure conta paga do ngrok

### ⚠️ Teste Sempre
- Após configurar, sempre teste clicando no botão do email
- Se não funcionar, verifique se ngrok está rodando

## 🔧 Troubleshooting

### Problema: Ainda dá erro JSON
**Solução:**
1. Verifique se ngrok está rodando: `ngrok http 3001`
2. Teste URL diretamente: `https://SUA_URL.ngrok.io/api/health`
3. Confirme variável no Netlify: Site Settings > Environment Variables
4. Force rebuild: Deploys > Trigger deploy

### Problema: ngrok não instala
**Solução:**
```bash
# Instalar manualmente
npm install -g ngrok

# Ou baixar do site
# https://ngrok.com/download
```

### Problema: Backend não responde
**Solução:**
1. Verifique se backend está rodando: `npm run devall`
2. Teste local: `http://localhost:3001/api/health`
3. Verifique se SQL foi executado no Supabase

## 📊 Checklist Final

- [ ] ngrok instalado e rodando
- [ ] URL HTTPS copiada
- [ ] Variável `VITE_API_URL` configurada no Netlify
- [ ] Deploy realizado no Netlify
- [ ] Teste realizado clicando no botão do email
- [ ] ✅ Nota fiscal carrega sem erro!

---

**🎉 Após seguir estes passos, o problema estará 100% resolvido!**