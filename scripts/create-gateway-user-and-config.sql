-- =================================================================
-- Script para Criar um Usuário do Tipo 'gateway_user' e
-- Configurar um Gateway do Tipo 'Asset'
-- =================================================================
--
-- Instruções:
-- 1. Abra o SQL Editor no seu painel do Supabase.
-- 2. Copie e cole todo o conteúdo deste script.
-- 3. !! IMPORTANTE !! Altere os valores nos placeholders abaixo.
-- 4. Execute o script.
--
-- Placeholders para alterar:
--    - 'SUA_ASSET_API_KEY_AQUI': Sua chave de API real do gateway Asset.
--    - 'SEU_ASSET_WEBHOOK_SECRET_AQUI': Seu segredo de webhook real.
--
-- =================================================================

DO $$
DECLARE
  -- Variáveis para armazenar os IDs gerados, com tipos herdados das colunas
  new_client_id public.clients.id%TYPE;
  new_gateway_id public.gateways.id%TYPE;
  new_user_id auth.users.id%TYPE;
BEGIN
  -- Passo 1: Criar um novo cliente para associar ao gateway.
  INSERT INTO public.clients (name)
  VALUES ('Cliente Asset')
  RETURNING id INTO new_client_id;

  RAISE NOTICE 'Cliente criado com ID: %', new_client_id;

  -- Passo 2: Criar o gateway do tipo 'Asset' associado ao cliente.
  INSERT INTO public.gateways (client_id, type, name, config)
  VALUES (
    new_client_id,
    'Asset',
    'Gateway Principal Asset',
    jsonb_build_object(
      'api_key', 'SUA_ASSET_API_KEY_AQUI',
      'webhook_secret', 'SEU_ASSET_WEBHOOK_SECRET_AQUI'
    )
  )
  RETURNING id INTO new_gateway_id;

  RAISE NOTICE 'Gateway criado com ID: %', new_gateway_id;

  -- Passo 3: Criar o usuário de autenticação usando a função auth.signup.
  -- Isso garante que todos os gatilhos e padrões sejam aplicados corretamente.
  -- Passo 3: Criar o usuário de autenticação com um ID gerado manualmente.
  -- Isso contorna problemas com a função auth.signup em alguns ambientes.
  INSERT INTO auth.users (id, email, encrypted_password, raw_user_meta_data)
  VALUES (
    gen_random_uuid(), -- Gera um UUID para o novo usuário
    'asset@gmail.com',
    crypt('asset123', gen_salt('bf')),
    jsonb_build_object('full_name', 'Usuário Gateway Asset')
  )
  RETURNING id INTO new_user_id;

  RAISE NOTICE 'Usuário de autenticação criado com ID: %', new_user_id;

  -- Passo 4: Criar o perfil público para o usuário, associando-o ao cliente e ao gateway.
  INSERT INTO public.profiles (id, role, client_id, gateway_id, full_name)
  VALUES (
    new_user_id,
    'gateway_user', -- Define a role como 'gateway_user'
    new_client_id,
    new_gateway_id,
    'Usuário Gateway Asset'
  );

  RAISE NOTICE 'Perfil do usuário criado e associado com sucesso.';

END $$;
