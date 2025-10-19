@echo off
echo 🧪 Testando correção da nota fiscal...
echo.

REM Verificar se o servidor está rodando
echo 🔍 Verificando se o servidor está rodando na porta 3001...
curl -s http://localhost:3001/health > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Servidor não está rodando na porta 3001
    echo 💡 Execute 'npm run devall' primeiro
    pause
    exit /b 1
)

echo ✅ Servidor está rodando
echo.

REM Executar o teste
echo 🚀 Executando teste da nota fiscal...
npx tsx src/scripts/test-invoice-fix.ts

echo.
echo 📊 Teste concluído. Verifique os logs acima para identificar o problema.
pause