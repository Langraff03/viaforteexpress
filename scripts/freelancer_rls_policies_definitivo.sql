-- Script definitivo para implementar políticas RLS para freelancers
-- Corrigido para evitar problema de enum na mesma transação
-- Execute este script para configurar o isolamento de dados entre freelancers

-- 1. Adicionar 'freelancer' ao enum app_role se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'freelancer' 
        AND enumtypid = 'app_role'::regtype
    ) THEN
        ALTER TYPE app_role ADD VALUE 'freelancer';
        RAISE NOTICE 'Valor freelancer adicionado ao enum app_role';
    ELSE
        RAISE NOTICE 'Valor freelancer já existe no enum app_role';
    END IF;
END $$;

-- COMMIT para permitir uso do novo valor do enum
COMMIT;

-- 2. Adicionar coluna created_by na tabela orders se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE orders ADD COLUMN created_by UUID REFERENCES auth.users(id);
        CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
        RAISE NOTICE 'Coluna created_by adicionada à tabela orders';
    ELSE
        RAISE NOTICE 'Coluna created_by já existe na tabela orders';
    END IF;
END $$;

-- 3. Habilitar RLS nas tabelas necessárias
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar funções auxiliares para verificação de roles
CREATE OR REPLACE FUNCTION is_freelancer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'freelancer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_gateway_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'gateway_user'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar política para orders (isolamento por freelancer)
DROP POLICY IF EXISTS "freelancer_orders_policy" ON orders;
CREATE POLICY "freelancer_orders_policy" 
ON orders 
FOR ALL 
TO authenticated
USING (
    -- Permitir acesso se o usuário for admin ou gateway_user (veem tudo)
    is_admin(auth.uid()) OR is_gateway_user(auth.uid())
    OR
    -- Permitir acesso se o usuário for freelancer e criou o pedido (isolamento)
    (is_freelancer(auth.uid()) AND orders.created_by = auth.uid())
);

-- 6. Criar política para profiles (cada um vê apenas o próprio perfil)
DROP POLICY IF EXISTS "freelancer_profiles_policy" ON profiles;
CREATE POLICY "freelancer_profiles_policy"
ON profiles
FOR ALL
TO authenticated
USING (
    -- Permitir acesso se o usuário for admin (pode ver todos os perfis)
    is_admin(auth.uid())
    OR
    -- Permitir acesso se for o próprio usuário (qualquer role)
    profiles.id = auth.uid()
);

-- 7. Criar trigger para definir created_by automaticamente
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS orders_set_created_by ON orders;
CREATE TRIGGER orders_set_created_by
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

-- 8. Conceder permissões necessárias
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- 9. Atualizar pedidos órfãos para um usuário admin
DO $$
DECLARE
    admin_user_id UUID;
    updated_count INTEGER;
BEGIN
    -- Buscar um usuário admin
    SELECT id INTO admin_user_id 
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Atualizar pedidos sem created_by para o admin
        UPDATE orders 
        SET created_by = admin_user_id
        WHERE created_by IS NULL;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Pedidos órfãos atualizados para admin (%): %', admin_user_id, updated_count;
    ELSE
        RAISE NOTICE 'Nenhum usuário admin encontrado. Pedidos órfãos permanecerão sem created_by.';
    END IF;
END $$;

-- 10. Verificação final (sem usar o enum recém-criado)
SELECT 
    'Sistema de freelancers configurado com sucesso!' as message,
    (SELECT COUNT(*) FROM orders WHERE created_by IS NULL) as pedidos_orfaos;

-- 11. Mostrar resumo da configuração
SELECT 
    'Configuração finalizada:' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'created_by') as orders_tem_created_by,
    (SELECT COUNT(*) FROM pg_enum WHERE enumlabel = 'freelancer' AND enumtypid = 'app_role'::regtype) as freelancer_role_existe,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'orders' AND policyname = 'freelancer_orders_policy') as policy_orders_existe,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'freelancer_profiles_policy') as policy_profiles_existe;