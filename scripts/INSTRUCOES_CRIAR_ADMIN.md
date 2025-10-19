# Instruções para Criar Usuário Administrador no Supabase

Como estamos enfrentando problemas de conectividade com o Supabase via API, vamos criar o usuário administrador diretamente através do painel de administração do Supabase.

## Passo 1: Acessar o Painel do Supabase

1. Acesse [https://app.supabase.com/](https://app.supabase.com/)
2. Faça login com suas credenciais
3. Selecione o projeto "Rapid Transporte"

## Passo 2: Criar um Cliente

1. No menu lateral, clique em "Table Editor"
2. Selecione a tabela `clients`
3. Clique em "Insert Row" e preencha:
   - `name`: Rapid Transporte
   - O campo `created_at` será preenchido automaticamente
4. Clique em "Save"
5. **Anote o ID do cliente** que foi gerado (formato UUID)

## Passo 3: Criar Usuário na Autenticação

1. No menu lateral, clique em "Authentication"
2. Clique em "Users"
3. Clique em "Add User"
4. Preencha:
   - Email: lucasadmi@gmail.com
   - Password: admin123
5. Marque a opção "Auto-confirm user"
6. Clique em "Create User"
7. **Anote o ID do usuário** que foi gerado (formato UUID)

## Passo 4: Adicionar Usuário na Tabela `users`

1. Volte para "Table Editor"
2. Selecione a tabela `users`
3. Clique em "Insert Row" e preencha:
   - `id`: [Cole o ID do usuário obtido no Passo 3]
   - `email`: lucasadmi@gmail.com
   - `name`: Lucas Admin
   - `password_hash`: $2a$10$rKN1VoYkPJJj/Uh9xQeQx.VTjZXwGFuMNmJ5.rP5FnLJVZXw5Kpxu
   - `role`: admin
   - `client_id`: [Cole o ID do cliente obtido no Passo 2]
   - Os campos `created_at` e `updated_at` serão preenchidos automaticamente
4. Clique em "Save"

## Passo 5: Verificar a Criação do Usuário

1. Volte para "Authentication" > "Users"
2. Verifique se o usuário `lucasadmi@gmail.com` está listado e confirmado
3. Volte para "Table Editor" > `users`
4. Verifique se o usuário está listado com o papel `admin` e associado ao cliente correto

## Passo 6: Testar o Login

1. Acesse a aplicação em seu ambiente de desenvolvimento ou produção
2. Tente fazer login com:
   - Email: lucasadmi@gmail.com
   - Senha: admin123
3. Você deve ser redirecionado para o painel de administração após o login bem-sucedido

## Observações

- O hash da senha fornecido já corresponde à senha `admin123`
- Se você quiser gerar um novo hash para uma senha diferente, pode usar o site [bcrypt-generator.com](https://bcrypt-generator.com/) ou executar o seguinte comando Node.js:
  ```javascript
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('sua_nova_senha', 10);
  console.log(hash);