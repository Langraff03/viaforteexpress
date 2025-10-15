@echo off
echo 🚀 Configurando ngrok para expor backend...
echo.

REM Verificar se ngrok está instalado
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ngrok não encontrado. Instalando...
    npm install -g ngrok
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Erro ao instalar ngrok. Instale manualmente:
        echo    npm install -g ngrok
        pause
        exit /b 1
    )
)

echo ✅ ngrok encontrado!
echo.
echo 📡 Expondo backend na porta 3001...
echo.
echo ⚠️  IMPORTANTE: Mantenha esta janela aberta!
echo ⚠️  Copie a URL HTTPS que aparecerá abaixo
echo ⚠️  Configure no Netlify: Site Settings > Environment Variables
echo ⚠️  Variável: VITE_API_URL = https://SUA_URL_NGROK.ngrok.io/api
echo.
pause

ngrok http 3001