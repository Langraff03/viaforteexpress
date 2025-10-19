#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configurações
BASE_URL="http://localhost:3000"
CONCURRENT_USERS=50
REQUESTS_PER_USER=100
TEST_DURATION=300 # 5 minutos

echo -e "${YELLOW}Iniciando teste de carga...${NC}"

# Função para testar endpoint
test_endpoint() {
    local endpoint=$1
    local method=$2
    local data=$3
    
    echo -e "\n${YELLOW}Testando $endpoint...${NC}"
    
    # Teste de carga com Apache Bench
    ab -n $REQUESTS_PER_USER -c $CONCURRENT_USERS \
       -p $data -T 'application/json' \
       -m $method \
       $BASE_URL$endpoint
}

# Teste de saúde do sistema
echo -e "${YELLOW}Verificando saúde do sistema...${NC}"
curl -s $BASE_URL/health

# Teste de criação de pedido
test_endpoint "/api/orders" "POST" '{
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "amount": 1000
}'

# Teste de listagem de pedidos
test_endpoint "/api/orders" "GET"

# Teste de webhook
test_endpoint "/webhook/payment" "POST" '{
    "event": "payment.confirmed",
    "data": {
        "id": "test_payment",
        "amount": 1000
    }
}'

# Monitoramento de recursos durante o teste
echo -e "\n${YELLOW}Monitorando recursos durante o teste...${NC}"
top -b -n 1 | head -n 20

# Verificar logs
echo -e "\n${YELLOW}Verificando logs...${NC}"
docker-compose logs --tail=50

echo -e "\n${GREEN}Teste de carga concluído!${NC}" 