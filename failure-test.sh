#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando simulação de falhas...${NC}"

# Função para testar recuperação
test_recovery() {
    local service=$1
    local action=$2
    
    echo -e "\n${YELLOW}Testando recuperação do $service...${NC}"
    echo -e "${YELLOW}Ação: $action${NC}"
    
    # Executar ação
    eval $action
    
    # Aguardar recuperação
    sleep 10
    
    # Verificar status
    docker-compose ps $service
    
    # Verificar logs
    docker-compose logs --tail=20 $service
}

# 1. Teste de falha do Redis
test_recovery "redis" "docker-compose stop redis && docker-compose start redis"

# 2. Teste de falha do Supabase
test_recovery "db" "docker-compose stop db && docker-compose start db"

# 3. Teste de falha da aplicação
test_recovery "app" "docker-compose restart app"

# 4. Teste de falha de rede
echo -e "\n${YELLOW}Simulando falha de rede...${NC}"
docker network disconnect rapidtransporte-network app
sleep 5
docker network connect rapidtransporte-network app

# 5. Teste de falha de disco
echo -e "\n${YELLOW}Simulando falha de disco...${NC}"
docker-compose exec app sh -c "dd if=/dev/zero of=/tmp/test bs=1M count=1000"

# 6. Teste de recuperação de backup
echo -e "\n${YELLOW}Testando recuperação de backup...${NC}"
./backup.sh
docker-compose down
docker-compose up -d

# 7. Teste de falha de SSL
echo -e "\n${YELLOW}Simulando falha de SSL...${NC}"
mv /etc/nginx/sites-available/rapidtransporte /etc/nginx/sites-available/rapidtransporte.bak
nginx -t && systemctl restart nginx
sleep 5
mv /etc/nginx/sites-available/rapidtransporte.bak /etc/nginx/sites-available/rapidtransporte
nginx -t && systemctl restart nginx

echo -e "\n${GREEN}Simulação de falhas concluída!${NC}" 