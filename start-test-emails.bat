@echo off
echo Verificando se o Redis esta instalado...

where redis-cli >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Redis nao esta instalado. Por favor, instale o Redis antes de continuar.
    echo Visite https://github.com/microsoftarchive/redis/releases para baixar o Redis para Windows.
    pause
    exit /b 1
)

echo Verificando se o Redis esta em execucao...
redis-cli ping >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Redis nao esta em execucao. Iniciando o Redis...
    start "" redis-server
    timeout /t 2 >nul
)

echo Verificando se o ngrok esta instalado...
where ngrok >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ngrok nao esta instalado. Por favor, instale o ngrok antes de continuar.
    echo Visite https://ngrok.com/download para instrucoes de instalacao.
    pause
    exit /b 1
)

echo Parando processos em execucao...
taskkill /F /IM node.exe /T 2>nul

echo Iniciando todos os servicos em terminais separados...

echo Iniciando servidor webhook...
start "Webhook Server" cmd /k "npm run dev:webhook"

echo Iniciando worker de email...
start "Email Worker" cmd /k "npm run dev:email"

echo Iniciando worker de pagamento...
start "Payment Worker" cmd /k "npm run dev:payment"

echo Iniciando worker de rastreamento...
start "Tracking Worker" cmd /k "npm run dev:tracking"

echo Iniciando worker de webhook de pagamento...
start "Payment Webhook Worker" cmd /k "npm run dev:payment-webhook"

echo Iniciando ngrok...
start "Ngrok" cmd /k "npm run dev:ngrok"

echo Todos os servicos foram iniciados!
echo Copie a URL do ngrok e use-a como URL de webhook no gateway de pagamento.
echo.
echo Para encerrar todos os processos, feche esta janela e execute:
echo taskkill /F /IM node.exe /T
echo.
echo Pressione qualquer tecla para encerrar todos os processos...
pause >nul

echo Encerrando todos os processos...
taskkill /F /IM node.exe /T 2>nul