-- Script corrigido para implementar políticas RLS para freelancers
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

-- 3. Habilitar RLS nas tabelas se ainda não estiver habilitado
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
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

-- 5. Criar política para orders
DROP POLICY IF EXISTS "freelancer_orders_policy" ON orders;
CREATE POLICY "freelancer_orders_policy" 
ON orders 
FOR ALL 
TO authenticated
USING (
    -- Permitir acesso se o usuário for admin ou gateway_user
    is_admin(auth.uid()) OR is_gateway_user(auth.uid())
    OR
    -- Permitir acesso se o usuário for freelancer e criou o pedido
    (is_freelancer(auth.uid()) AND orders.created_by = auth.uid())
);

-- 6. Criar política para email_logs
DROP POLICY IF EXISTS "freelancer_email_logs_policy" ON email_logs;
CREATE POLICY "freelancer_email_logs_policy"
ON email_logs
FOR ALL
TO authenticated
USING (
    -- Permitir acesso se o usuário for admin ou gateway_user
    is_admin(auth.uid()) OR is_gateway_user(auth.uid())
    OR
    -- Permitir acesso se o usuário for freelancer e o email_log for de um pedido dele
    (
        is_freelancer(auth.uid())
        AND EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = email_logs.order_id 
            AND orders.created_by = auth.uid()
        )
    )
);

-- 7. Criar política para profiles
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

-- 8. Criar trigger para definir created_by automaticamente
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

-- 9. Conceder permissões necessárias
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT SELECT ON email_logs TO authenticated;
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- 10. Verificar se existem usuários admin para atualizar orders órfãos
DO $$
DECLARE
    admin_user_id UUID;
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
        
        RAISE NOTICE 'Pedidos órfãos atualizados para admin: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Nenhum usuário admin encontrado. Pedidos órfãos permanecerão sem created_by.';
    END IF;
END $$;

-- Verificação final
SELECT 
    'Políticas RLS para freelancers implementadas com sucesso!' as message,
    (SELECT COUNT(*) FROM orders WHERE created_by IS NULL) as pedidos_orfaos,
    (SELECT COUNT(*) FROM profiles WHERE role = 'freelancer') as freelancers_existentes;