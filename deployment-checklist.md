# Checklist de Deploy

## 1. Pré-requisitos
- [ ] Servidor Ubuntu 22.04 LTS
- [ ] Domínio configurado (rapidtransporte.com)
- [ ] DNS apontando para o servidor
- [ ] Certificado SSL (Let's Encrypt)
- [ ] Contas e credenciais:
  - [ ] Supabase
  - [ ] Resend
  - [ ] Asset

## 2. Configuração do Servidor
- [ ] Atualização do sistema
- [ ] Instalação do Docker
- [ ] Instalação do Docker Compose
- [ ] Configuração do firewall
- [ ] Configuração do Nginx
- [ ] Configuração do SSL

## 3. Configuração da Aplicação
- [ ] Clone do repositório
- [ ] Configuração do .env
- [ ] Build das imagens Docker
- [ ] Inicialização dos containers
- [ ] Verificação dos logs

## 4. Testes
- [ ] Teste de conectividade
- [ ] Teste de SSL
- [ ] Teste de API
- [ ] Teste de webhook
- [ ] Teste de email
- [ ] Teste de pagamento

## 5. Monitoramento
- [ ] Configuração do monitoring.sh
- [ ] Configuração de alertas
- [ ] Configuração de logs
- [ ] Configuração de métricas

## 6. Backup
- [ ] Configuração do backup.sh
- [ ] Teste de backup
- [ ] Teste de restauração
- [ ] Configuração de retenção

## 7. Segurança
- [ ] Verificação de headers
- [ ] Verificação de SSL
- [ ] Verificação de firewall
- [ ] Verificação de logs
- [ ] Verificação de permissões

## 8. Performance
- [ ] Teste de carga
- [ ] Otimização de cache
- [ ] Otimização de banco de dados
- [ ] Otimização de rede

## 9. Documentação
- [ ] Documentação de deploy
- [ ] Documentação de manutenção
- [ ] Documentação de backup
- [ ] Documentação de monitoramento 