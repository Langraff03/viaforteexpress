-- Script para implementar políticas RLS para freelancers
-- Execute este script para configurar o isolamento de dados entre freelancers
-- 1. Verificar se o role 'freelancer' já existe no enum
-- Se não existir, adicionar ao enum app_role
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'freelancer'
        AND enumtypid = 'app_role'::regtype
    ) THEN
        ALTER TYPE app_role ADD VALUE 'freelancer';
    END IF;
END $$;
END $$;

-- 2. Habilitar RLS na tabela orders se ainda não estiver habilitado
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para freelancers na tabela orders
-- Freelancers só podem ver pedidos que criaram
DROP POLICY IF EXISTS "freelancer_orders_policy" ON orders;
CREATE POLICY "freelancer_orders_policy" 
ON orders 
FOR ALL 
TO authenticated
USING (
    -- Permitir acesso se o usuário for admin ou gateway_user (existente)
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'gateway_user')
    )
    OR
    -- Permitir acesso se o usuário for freelancer e criou o pedido
    (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'freelancer'
        )
        AND orders.created_by = auth.uid()
    )
);

-- 4. Habilitar RLS na tabela email_logs se ainda não estiver habilitado
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- 5. Criar política para freelancers na tabela email_logs
-- Freelancers só podem ver logs de emails dos seus próprios pedidos
DROP POLICY IF EXISTS "freelancer_email_logs_policy" ON email_logs;
CREATE POLICY "freelancer_email_logs_policy"
ON email_logs
FOR ALL
TO authenticated
USING (
    -- Permitir acesso se o usuário for admin ou gateway_user (existente)
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'gateway_user')
    )
    OR
    -- Permitir acesso se o usuário for freelancer e o email_log for de um pedido dele
    (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'freelancer'
        )
        AND EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = email_logs.order_id 
            AND orders.created_by = auth.uid()
        )
    )
);

-- 6. Criar política para freelancers na tabela profiles
-- Freelancers só podem ver/atualizar seu próprio perfil
DROP POLICY IF EXISTS "freelancer_profiles_policy" ON profiles;
CREATE POLICY "freelancer_profiles_policy"
ON profiles
FOR ALL
TO authenticated
USING (
    -- Permitir acesso se o usuário for admin (pode ver todos os perfis)
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.role = 'admin'
    )
    OR
    -- Permitir acesso se for o próprio usuário (qualquer role)
    profiles.id = auth.uid()
);

-- 7. Adicionar coluna created_by na tabela orders se ainda não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE orders ADD COLUMN created_by UUID REFERENCES auth.users(id);
        
        -- Adicionar índice para melhor performance
        CREATE INDEX idx_orders_created_by ON orders(created_by);
    END IF;
END $$;

-- 8. Atualizar pedidos existentes para ter created_by como admin
-- (apenas para dados existentes - novos pedidos já terão created_by preenchido)
UPDATE orders 
SET created_by = (
    SELECT id FROM auth.users 
    WHERE email = 'admin@example.com' -- Substitua pelo email do admin
    LIMIT 1
)
WHERE created_by IS NULL;

-- 9. Criar função para verificar se um usuário é freelancer
CREATE OR REPLACE FUNCTION is_freelancer(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'freelancer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Criar função para verificar se um usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Criar função para verificar se um usuário é gateway_user
CREATE OR REPLACE FUNCTION is_gateway_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'gateway_user'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Atualizar política das orders para usar as funções
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

-- 13. Atualizar política dos email_logs para usar as funções
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

-- 14. Criar trigger para automaticamente definir created_by em novos pedidos
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

-- 15. Conceder permissões necessárias
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT SELECT ON email_logs TO authenticated;
GRANT SELECT, UPDATE ON profiles TO authenticated;

-- 16. Criar alguns usuários freelancer de exemplo (opcional para testes)
-- NOTA: Remova esta seção em produção
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'freelancer1@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
    (gen_random_uuid(), 'freelancer2@example.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (id, role, client_id, gateway_id, full_name, updated_at)
SELECT
    id,
    'freelancer'::app_role,
    NULL,
    NULL,
    'Freelancer ' || ROW_NUMBER() OVER (ORDER BY created_at),
    NOW()
FROM auth.users
WHERE email LIKE 'freelancer%@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'freelancer'::app_role;
*/

-- Fim do script
SELECT 'Políticas RLS para freelancers criadas com sucesso!' as message;