# Rapid Transporte - Backend

Sistema de gerenciamento de logística e rastreamento de encomendas.

## 🚀 Tecnologias

- Node.js
- Docker
- Nginx
- Redis
- Supabase

## 📋 Pré-requisitos

- Docker
- Docker Compose
- Node.js 18+
- NPM ou Yarn

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Llangraff/subir-para-produ-o.git
cd subir-para-produ-o
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. Instale as dependências:
```bash
npm install
```

## 🚀 Deploy

1. Execute o script de setup do servidor:
```bash
./server-setup.sh
```

2. Execute o deploy:
```bash
./deploy.sh
```

## 📊 Monitoramento

Para monitorar o sistema:
```bash
./monitoring.sh
```

## 🔄 Backup

Para fazer backup manual:
```bash
./backup.sh
```

## 🛠️ Scripts Disponíveis

- `deploy.sh`: Script de deploy
- `monitoring.sh`: Script de monitoramento
- `backup.sh`: Script de backup
- `rollback.sh`: Script de rollback
- `security-check.sh`: Verificação de segurança
- `load-test.sh`: Teste de carga
- `failure-test.sh`: Simulação de falhas

## 🔒 Segurança

O sistema inclui:
- SSL/TLS
- Headers de segurança
- Firewall configurado
- Monitoramento de logs
- Backup automático

## 📝 Licença

Este projeto está sob a licença MIT. 