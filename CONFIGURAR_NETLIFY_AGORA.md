# 🚀 CONFIGURAR NETLIFY AGORA - Guia Rápido

## ✅ Commit Realizado com Sucesso!

O projeto foi enviado para: https://github.com/Llangraff/rastreio-com-nota-fiscal-implementada.git

## 📋 Próximos Passos no Netlify

### 1. 🔗 Conectar Novo Repositório
1. Acesse **Netlify Dashboard**
2. Vá no seu site atual
3. **Site Settings > Build & Deploy > Repository**
4. Clique em **"Link to a different repository"**
5. Selecione: `Llangraff/rastreio-com-nota-fiscal-implementada`

### 2. ⚙️ Configurar Build Settings
1. **Build command:** `npm run build:frontend`
2. **Publish directory:** `dist`
3. **Node version:** `18`

### 3. 🔧 Adicionar Variável de Ambiente
1. **Site Settings > Environment Variables**
2. **Add Variable:**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://fastlogexpress.ngrok.app/api`
3. **Save**

### 4. 🚀 Deploy
1. **Deploys > Trigger deploy > Deploy site**
2. Aguarde terminar

### 5. 🧪 Testar
1. Envie email de rastreamento
2. Clique "Ver Nota Fiscal"
3. ✅ **Deve funcionar!**

## 🎯 Variável Importante

**VITE_API_URL = https://fastlogexpress.ngrok.app/api**

(Use exatamente a URL do seu ngrok + /api)

## ⚠️ Lembrete

- Mantenha o ngrok rodando: `setup-ngrok.bat`
- Se a URL do ngrok mudar, atualize a variável no Netlify

---

**🎉 Após configurar, a nota fiscal funcionará perfeitamente!**