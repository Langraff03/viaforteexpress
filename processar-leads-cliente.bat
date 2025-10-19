@echo off
echo ===================================================
echo    PROCESSADOR DE LEADS DE CLIENTES - FASTLOG
echo ===================================================
echo.

if "%~1"=="" goto :usage
if "%~2"=="" goto :usage

echo Processando leads do cliente: %1
echo Arquivo: %2
echo.

node src/scripts/process-client-leads.js %1 %2
goto :end

:usage
echo ERRO: Argumentos insuficientes
echo.
echo Uso: processar-leads-cliente.bat NOME_CLIENTE CAMINHO_ARQUIVO_JSON
echo.
echo Exemplo: processar-leads-cliente.bat empresa-abc leads-empresa-abc.json
echo.

:end
pause