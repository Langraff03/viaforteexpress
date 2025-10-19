@echo off
echo ===================================================
echo    PROCESSADOR DE LEADS DE BANCO EXTERNO - FASTLOG
echo ===================================================
echo.

if "%~1"=="" goto :usage
if "%~2"=="" goto :usage
if "%~3"=="" goto :usage

echo Processando leads do cliente: %1
echo Configuração de banco: %2
echo Configuração de oferta: %3
echo.

rem Verificar se os arquivos existem
if not exist "%~2" (
    echo ERRO: Arquivo de configuração de banco não encontrado: %2
    goto :end
)

if not exist "%~3" (
    echo ERRO: Arquivo de configuração de oferta não encontrado: %3
    goto :end
)

rem Verificar se as dependências estão instaladas
echo Verificando dependências...
node -e "try { require('pg'); console.log('PostgreSQL: OK'); } catch(e) { console.log('PostgreSQL: Não instalado'); }"
node -e "try { require('mysql2'); console.log('MySQL: OK'); } catch(e) { console.log('MySQL: Não instalado'); }"
node -e "try { require('mssql'); console.log('SQL Server: OK'); } catch(e) { console.log('SQL Server: Não instalado'); }"
echo.

echo Iniciando processamento...
echo.

rem Executar o script de processamento
node src/scripts/process-external-db-leads.js "%~2" "%~3"
goto :end

:usage
echo ERRO: Argumentos insuficientes
echo.
echo Uso: processar-leads-banco-externo.bat NOME_CLIENTE CAMINHO_CONFIG_BANCO CAMINHO_CONFIG_OFERTA
echo.
echo Exemplo: processar-leads-banco-externo.bat empresa-abc exemplo-db-config.json oferta-config.json
echo.
echo Para instalar as dependências necessárias, execute:
echo npm install pg mysql2 mssql
echo.

:end
pause