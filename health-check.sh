#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Verificando saúde dos serviços...${NC}"

# Função para verificar endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local response=$(curl -s -o /dev/null -w "%{http_code}" $url)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ $name está funcionando (HTTP $response)${NC}"
    else
        echo -e "${RED}✗ $name está com problemas (HTTP $response)${NC}"
    fi
}

# Verificar API principal
check_endpoint "http://localhost:3000/health" "API Principal"

# Verificar Webhook
check_endpoint "http://localhost:3001/webhook/health" "Webhook Server"

# Verificar Redis
echo -e "${YELLOW}Verificando Redis...${NC}"
if docker-compose exec redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✓ Redis está funcionando${NC}"
else
    echo -e "${RED}✗ Redis está com problemas${NC}"
fi

# Verificar Workers
echo -e "${YELLOW}Verificando Workers...${NC}"

# Payment Worker
if docker-compose ps payment-worker | grep -q "Up"; then
    echo -e "${GREEN}✓ Payment Worker está rodando${NC}"
else
    echo -e "${RED}✗ Payment Worker está parado${NC}"
fi

# Email Worker
if docker-compose ps email-worker | grep -q "Up"; then
    echo -e "${GREEN}✓ Email Worker está rodando${NC}"
else
    echo -e "${RED}✗ Email Worker está parado${NC}"
fi

# Tracking Worker
if docker-compose ps tracking-worker | grep -q "Up"; then
    echo -e "${GREEN}✓ Tracking Worker está rodando${NC}"
else
    echo -e "${RED}✗ Tracking Worker está parado${NC}"
fi

# Verificar uso de recursos
echo -e "${YELLOW}Verificando uso de recursos...${NC}"
docker stats --no-stream

echo -e "${GREEN}Verificação concluída!${NC}" 