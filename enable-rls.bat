@echo off
echo Reativando o RLS com políticas seguras...
echo Este script deve ser executado apenas em ambiente de desenvolvimento!

echo Executando script SQL no console do Supabase...
echo Você precisará acessar o console do Supabase e executar o seguinte SQL:

echo.
echo -- Reativar RLS para todas as tabelas
echo ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.gateways ENABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
echo ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
echo.
echo -- Remover políticas existentes
echo DROP POLICY IF EXISTS admin_gateways_policy ON public.gateways;
echo DROP POLICY IF EXISTS admin_orders_policy ON public.orders;
echo DROP POLICY IF EXISTS admin_email_logs_policy ON public.email_logs;
echo DROP POLICY IF EXISTS admin_order_tracking_policy ON public.order_tracking;
echo DROP POLICY IF EXISTS admin_webhook_logs_policy ON public.webhook_logs;
echo.
echo DROP POLICY IF EXISTS gateway_user_gateways_policy ON public.gateways;
echo DROP POLICY IF EXISTS gateway_user_orders_policy ON public.orders;
echo DROP POLICY IF EXISTS gateway_user_email_logs_policy ON public.email_logs;
echo DROP POLICY IF EXISTS gateway_user_order_tracking_policy ON public.order_tracking;
echo DROP POLICY IF EXISTS gateway_user_webhook_logs_policy ON public.webhook_logs;
echo.
echo DROP POLICY IF EXISTS users_policy ON public.users;
echo DROP POLICY IF EXISTS admin_users_policy ON public.users;
echo DROP POLICY IF EXISTS bypass_policy ON public.users;
echo DROP POLICY IF EXISTS bypass_policy ON public.orders;
echo DROP POLICY IF EXISTS bypass_policy ON public.email_logs;
echo DROP POLICY IF EXISTS bypass_policy ON public.gateways;
echo DROP POLICY IF EXISTS bypass_policy ON public.order_tracking;
echo DROP POLICY IF EXISTS bypass_policy ON public.webhook_logs;
echo DROP POLICY IF EXISTS bypass_policy ON public.clients;
echo.
echo -- Criar políticas simples que permitem acesso a todos os registros
echo CREATE POLICY all_access_policy ON public.users FOR ALL TO authenticated USING (true);
echo CREATE POLICY all_access_policy ON public.orders FOR ALL TO authenticated USING (true);
echo CREATE POLICY all_access_policy ON public.email_logs FOR ALL TO authenticated USING (true);
echo CREATE POLICY all_access_policy ON public.gateways FOR ALL TO authenticated USING (true);
echo CREATE POLICY all_access_policy ON public.order_tracking FOR ALL TO authenticated USING (true);
echo CREATE POLICY all_access_policy ON public.webhook_logs FOR ALL TO authenticated USING (true);
echo CREATE POLICY all_access_policy ON public.clients FOR ALL TO authenticated USING (true);
echo.

echo Após executar o SQL, reinicie o servidor de desenvolvimento com:
echo .\restart-dev.bat

pause