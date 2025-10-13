-- Políticas RLS para tabela shopify_configs
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Habilitar RLS na tabela shopify_configs
ALTER TABLE shopify_configs ENABLE ROW LEVEL SECURITY;

-- 2. Política para freelancers poderem VER suas próprias configurações
CREATE POLICY "Freelancers podem ver suas próprias configurações Shopify"
ON shopify_configs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = shopify_configs.user_id 
    AND p.id = auth.uid()
    AND p.role = 'freelancer'
  )
);

-- 3. Política para freelancers poderem INSERIR suas próprias configurações
CREATE POLICY "Freelancers podem inserir suas próprias configurações Shopify"
ON shopify_configs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = shopify_configs.user_id 
    AND p.id = auth.uid()
    AND p.role = 'freelancer'
  )
);

-- 4. Política para freelancers poderem ATUALIZAR suas próprias configurações
CREATE POLICY "Freelancers podem atualizar suas próprias configurações Shopify"
ON shopify_configs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = shopify_configs.user_id 
    AND p.id = auth.uid()
    AND p.role = 'freelancer'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = shopify_configs.user_id 
    AND p.id = auth.uid()
    AND p.role = 'freelancer'
  )
);

-- 5. Política para freelancers poderem DELETAR suas próprias configurações
CREATE POLICY "Freelancers podem deletar suas próprias configurações Shopify"
ON shopify_configs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = shopify_configs.user_id 
    AND p.id = auth.uid()
    AND p.role = 'freelancer'
  )
);

-- 6. Política para admins poderem fazer tudo (opcional)
CREATE POLICY "Admins têm acesso total às configurações Shopify"
ON shopify_configs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- 7. Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'shopify_configs';