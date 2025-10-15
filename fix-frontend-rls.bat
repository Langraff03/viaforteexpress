@echo off
echo Aplicando correção das policies RLS para permitir leitura do frontend...
echo.

REM Carrega as variáveis de ambiente do arquivo .env
for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="VITE_SUPABASE_URL" set SUPABASE_URL=%%b
    if "%%a"=="SUPABASE_SERVICE_ROLE_KEY" set SERVICE_ROLE_KEY=%%b
)

REM Extrai o ID do projeto da URL do Supabase
for /f "tokens=3 delims=/." %%a in ("%SUPABASE_URL%") do set PROJECT_ID=%%a

echo Conectando ao projeto: %PROJECT_ID%
echo URL: %SUPABASE_URL%
echo.

REM Executa o script SQL usando a CLI do Supabase
echo Executando script de correção das policies RLS...
supabase db reset --db-url "postgresql://postgres:[SERVICE_ROLE_KEY]@db.%PROJECT_ID%.supabase.co:5432/postgres" --file scripts/fix-frontend-rls-policy.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Policies RLS corrigidas com sucesso!
    echo.
    echo Agora o frontend pode ler os pedidos, mas apenas o backend pode criar/atualizar.
    echo Teste acessando: %SUPABASE_URL%/tracking/SOSHTM
) else (
    echo.
    echo ❌ Erro ao aplicar as correções. Verifique se:
    echo 1. A CLI do Supabase está instalada
    echo 2. As variáveis de ambiente estão corretas
    echo 3. Você tem permissões de administrador no projeto
)

echo.
pause