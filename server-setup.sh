#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Iniciando setup do servidor...${NC}"

# Atualizar sistema
echo -e "${YELLOW}Atualizando sistema...${NC}"
apt update && apt upgrade -y

# Instalar dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    git \
    nginx \
    certbot \
    python3-certbot-nginx

# Instalar Docker
echo -e "${YELLOW}Instalando Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Instalar Docker Compose
echo -e "${YELLOW}Instalando Docker Compose...${NC}"
curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configurar firewall
echo -e "${YELLOW}Configurando firewall...${NC}"
ufw allow OpenSSH
ufw allow http
ufw allow https
ufw --force enable

# Criar diretório da aplicação
echo -e "${YELLOW}Criando diretório da aplicação...${NC}"
mkdir -p /var/www/fastlog
cd /var/www/fastlog

# Configurar SSL
echo -e "${YELLOW}Configurando SSL...${NC}"
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Criar arquivo .env
echo -e "${YELLOW}Criando arquivo .env...${NC}"
cat > .env << EOL
# Configurações do Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Configurações do Supabase
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_KEY=${SUPABASE_KEY}

# Configurações do Resend
RESEND_API_KEY=${RESEND_API_KEY}

# Configurações do Asset
ASSET_API_KEY=${ASSET_API_KEY}
ASSET_API_URL=${ASSET_API_URL}

# Configurações do Ambiente
NODE_ENV=production

# Configurações do Servidor
PORT=3000
HOST=0.0.0.0

# Configurações de Segurança
JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}

# Configurações de Backup
BACKUP_RETENTION_DAYS=7
BACKUP_DIR=backups
EOL

# Configurar backup automático
echo -e "${YELLOW}Configurando backup automático...${NC}"
(crontab -l 2>/dev/null; echo "0 0 * * * /var/www/fastlog/backup.sh") | crontab -

echo -e "${GREEN}Setup concluído!${NC}"
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. Configure as variáveis de ambiente no arquivo .env"
echo "2. Clone o repositório: git clone https://github.com/Llangraff/subir-para-produ-o.git ."
echo "3. Execute o deploy: ./deploy.sh" 