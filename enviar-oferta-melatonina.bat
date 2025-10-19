@echo off
echo ===================================================
echo    ENVIO DE OFERTA DE MELATONINA - PAGUE MENOS FARMA
echo ===================================================
echo.

set LIMIT=10
set FILTERS={}

:parse_args
if "%~1"=="" goto :start
if /i "%~1"=="--limit" (
    set LIMIT=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--filters" (
    set FILTERS=%~2
    shift
    shift
    goto :parse_args
)
shift
goto :parse_args

:start
echo Iniciando envio de oferta de Melatonina Fini Dr. Good
echo Limite de leads: %LIMIT%
echo Filtros: %FILTERS%
echo.

echo Verificando dependências...
node -e "try { require('@react-email/render'); console.log('React Email: OK'); } catch(e) { console.log('React Email: Não instalado. Execute: npm install @react-email/render'); }"
node -e "try { require('resend'); console.log('Resend: OK'); } catch(e) { console.log('Resend: Não instalado. Execute: npm install resend'); }"
echo.

echo Verificando configuração de API Key...
node -e "if (process.env.RESEND_API_KEY) { console.log('Resend API Key: Configurada'); } else { console.log('Resend API Key: Não configurada. Configure no arquivo .env'); }"
echo.

echo Iniciando processamento...
echo.

rem Verificar se as dependências necessárias estão instaladas
node -e "try { require('@react-email/render'); console.log('@react-email/render: OK'); } catch(e) { console.log('@react-email/render: Não instalado. Instalando...'); require('child_process').execSync('npm install @react-email/render', {stdio: 'inherit'}); }"
node -e "try { require('resend'); console.log('resend: OK'); } catch(e) { console.log('resend: Não instalado. Instalando...'); require('child_process').execSync('npm install resend', {stdio: 'inherit'}); }"
node -e "try { require('react'); console.log('react: OK'); } catch(e) { console.log('react: Não instalado. Instalando...'); require('child_process').execSync('npm install react', {stdio: 'inherit'}); }"
echo.

rem Executar o script de envio usando o novo arquivo JavaScript
node src/scripts/enviar-melatonina.js --limit %LIMIT% --filters %FILTERS%

echo.
echo ===================================================
echo    PROCESSAMENTO CONCLUÍDO
echo ===================================================
echo.
echo Para enviar para mais leads, ajuste o parâmetro --limit
echo Exemplo: enviar-oferta-melatonina.bat --limit 100
echo.
echo Para filtrar leads, use o parâmetro --filters com um objeto JSON
echo Exemplo: enviar-oferta-melatonina.bat --filters "{\"tags\":[\"interessado\"]}"
echo.

pause