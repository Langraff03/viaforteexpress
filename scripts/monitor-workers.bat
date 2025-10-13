@echo off
REM Script de monitoramento dos workers para Windows
REM Verifica se os workers estão rodando e reinicia se necessário

setlocal enabledelayedexpansion

set LOG_FILE=logs\workers-monitor.log
set PID_DIR=logs\pids

REM Criar diretórios se não existirem
if not exist logs mkdir logs
if not exist %PID_DIR% mkdir %PID_DIR%

REM Função de log
:log
echo %date% %time% - %~1 >> %LOG_FILE%
echo %~1
goto :eof

REM Verificar se processo está rodando
:check_process
set PROCESS_NAME=%~1
set PID_FILE=%PID_DIR%\%PROCESS_NAME%.pid

if exist "%PID_FILE%" (
    set /p PID=<"%PID_FILE%"
    tasklist /FI "PID eq %PID%" 2>NUL | find /I /N "node.exe">NUL
    if !errorlevel! equ 0 (
        REM Processo está rodando
        exit /b 0
    ) else (
        call :log "Processo %PROCESS_NAME% (PID: %PID%) não está mais rodando"
        del "%PID_FILE%" 2>NUL
        exit /b 1
    )
) else (
    exit /b 1
)
goto :eof

REM Reiniciar worker
:restart_worker
set WORKER_NAME=%~1
set WORKER_COMMAND=%~2

call :log "Reiniciando %WORKER_NAME%..."

REM Matar processo antigo se existir
set PID_FILE=%PID_DIR%\%WORKER_NAME%.pid
if exist "%PID_FILE%" (
    set /p OLD_PID=<"%PID_FILE%"
    taskkill /PID %OLD_PID% /F 2>NUL
    timeout /t 2 /nobreak >nul
    del "%PID_FILE%" 2>NUL
)

REM Iniciar novo processo em background
start /B cmd /C "%WORKER_COMMAND% > logs\%WORKER_NAME%.log 2>&1"
timeout /t 1 /nobreak >nul

REM Tentar encontrar o PID do novo processo (aproximado)
for /f "tokens=2" %%i in ('tasklist /FI "IMAGENAME eq node.exe" /FO TABLE ^| find "node.exe"') do set NEW_PID=%%i

if defined NEW_PID (
    echo %NEW_PID% > "%PID_FILE%"
    call :log "%WORKER_NAME% reiniciado (PID aproximado: %NEW_PID%)"
) else (
    call :log "%WORKER_NAME% reiniciado (PID não identificado)"
)
goto :eof

REM Verificar uso de memória
:check_memory
for /f "skip=1" %%p in ('wmic OS get FreePhysicalMemory /Value') do for /f "tokens=2 delims==" %%a in ("%%p") do set FREE_MEM=%%a
for /f "skip=1" %%p in ('wmic OS get TotalVisibleMemorySize /Value') do for /f "tokens=2 delims==" %%a in ("%%p") do set TOTAL_MEM=%%a

REM Calcular uso de memória em porcentagem
set /a MEM_USAGE=100-(!FREE_MEM!*100/!TOTAL_MEM!)

if !MEM_USAGE! gtr 80 (
    call :log "Uso de memória alto: !MEM_USAGE!%% - pode causar instabilidade"
    exit /b 1
)
exit /b 0
goto :eof

REM Verificar Redis (simplificado)
:check_redis
redis-cli ping 2>NUL | find "PONG" >NUL
if !errorlevel! equ 0 (
    exit /b 0
) else (
    call :log "Redis não está respondendo"
    exit /b 1
)
goto :eof

REM Função principal
:main
call :log "=== Iniciando monitoramento dos workers ==="

REM Verificar Redis
call :check_redis
if !errorlevel! neq 0 (
    call :log "Redis indisponível - pulando verificação dos workers"
    goto :end
)

REM Verificar uso de memória
call :check_memory
if !errorlevel! neq 0 (
    call :log "Uso de memória alto detectado"
)

REM Lista de workers para monitorar
set WORKERS[0]=webhook
set WORKERS[1]=payment
set WORKERS[2]=email
set WORKERS[3]=tracking
set WORKERS[4]=payment-webhook
set WORKERS[5]=lead

set COMMANDS[0]=npm run dev:webhook
set COMMANDS[1]=npm run dev:payment
set COMMANDS[2]=npm run dev:email
set COMMANDS[3]=npm run dev:tracking
set COMMANDS[4]=npm run dev:payment-webhook
set COMMANDS[5]=npm run dev:lead

set RESTARTED_COUNT=0

REM Verificar cada worker
for /L %%i in (0,1,5) do (
    setlocal enabledelayedexpansion
    set WORKER_NAME=!WORKERS[%%i]!
    set WORKER_COMMAND=!COMMANDS[%%i]!

    call :check_process !WORKER_NAME!
    if !errorlevel! neq 0 (
        call :restart_worker !WORKER_NAME! "!WORKER_COMMAND!"
        set /a RESTARTED_COUNT+=1
    ) else (
        call :log "!WORKER_NAME! está rodando normalmente"
    )
    endlocal
)

if %RESTARTED_COUNT% gtr 0 (
    call :log "%RESTARTED_COUNT% worker(s) foram reiniciados"
) else (
    call :log "Todos os workers estão funcionando corretamente"
)

call :log "=== Monitoramento concluído ==="

:end
REM Aguardar um pouco antes de sair para dar tempo dos processos iniciarem
timeout /t 3 /nobreak >nul
goto :eof

REM Executar função principal
call :main