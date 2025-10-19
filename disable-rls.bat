@echo off
echo Desativando temporariamente o RLS para diagnóstico...
echo Este script deve ser executado apenas em ambiente de desenvolvimento!

echo Executando script SQL no console do Supabase...
echo Você precisará acessar o console do Supabase e executar o seguinte SQL:

echo.
echo -- Desativar temporariamente RLS para diagnóstico
echo ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.email_logs DISABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.gateways DISABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.order_tracking DISABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.webhook_logs DISABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
echo.

echo Após executar o SQL, reinicie o servidor de desenvolvimento com:
echo .\restart-dev.bat

pause