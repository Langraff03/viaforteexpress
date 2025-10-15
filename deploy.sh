#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando deploy...${NC}"

# Verificar se o .env existe
if [ ! -f .env ]; then
    echo -e "${RED}Arquivo .env não encontrado!${NC}"
    echo -e "${YELLOW}Criando .env a partir do .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}Por favor, configure as variáveis no arquivo .env antes de continuar${NC}"
    exit 1
fi

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não está instalado. Por favor, instale o Docker primeiro.${NC}"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro.${NC}"
    exit 1
fi

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

# Subir containers
echo -e "${YELLOW}Subindo containers...${NC}"
docker-compose up -d

# Verificar se os containers subiram
echo -e "${YELLOW}Verificando status dos containers...${NC}"
docker-compose ps

# Verificar logs
echo -e "${YELLOW}Últimos logs:${NC}"
docker-compose logs --tail=50

# Verificar SSL
echo -e "${YELLOW}Verificando SSL...${NC}"
curl -I https://rastreio.logfastexpress.com

echo -e "${GREEN}Deploy concluído!${NC}"
echo -e "${YELLOW}Verifique os logs acima para garantir que tudo está funcionando corretamente.${NC}" 