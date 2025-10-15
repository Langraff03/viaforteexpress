#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando deploy no Digital Ocean...${NC}"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não está instalado. Instalando...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose não está instalado. Instalando...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Criar diretórios necessários
echo -e "${YELLOW}Criando diretórios...${NC}"
mkdir -p certbot/conf certbot/www

# Parar containers existentes
echo -e "${YELLOW}Parando containers existentes...${NC}"
docker-compose down

# Remover imagens antigas
echo -e "${YELLOW}Removendo imagens antigas...${NC}"
docker-compose rm -f
docker system prune -f

# Construir novas imagens
echo -e "${YELLOW}Construindo novas imagens...${NC}"
docker-compose build --no-cache

# Iniciar containers
echo -e "${YELLOW}Iniciando containers...${NC}"
docker-compose up -d

# Verificar status
echo -e "${YELLOW}Verificando status dos containers...${NC}"
docker-compose ps

# Verificar logs
echo -e "${YELLOW}Últimos logs:${NC}"
docker-compose logs --tail=50

# Configurar SSL
echo -e "${YELLOW}Configurando SSL...${NC}"
docker-compose run --rm certbot

# Reiniciar Nginx para aplicar SSL
echo -e "${YELLOW}Reiniciando Nginx...${NC}"
docker-compose restart nginx

# Verificar SSL
echo -e "${YELLOW}Verificando SSL...${NC}"
curl -I https://rastreio.logfastexpress.com

# Configurar renovação automática do SSL
echo -e "${YELLOW}Configurando renovação automática do SSL...${NC}"
(crontab -l 2>/dev/null; echo "0 0 * * * cd $(pwd) && docker-compose run --rm certbot renew") | crontab -

echo -e "${GREEN}Deploy concluído!${NC}"
echo -e "${YELLOW}Verifique se todos os serviços estão rodando corretamente:${NC}"
docker-compose ps 