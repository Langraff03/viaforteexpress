#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# URL base
BASE_URL="https://rastreio.logfastexpress.com"

# Função para verificar serviço
check_service() {
    local service=$1
    local endpoint=$2
    
    echo -e "\n${YELLOW}Verificando $service...${NC}"
    
    # Verificar se o serviço está respondendo
    response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL$endpoint)
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}$service está respondendo corretamente${NC}"
    else
        echo -e "${RED}$service não está respondendo corretamente (Status: $response)${NC}"
    fi
}

# Função para verificar recursos
check_resources() {
    echo -e "\n${YELLOW}Verificando uso de recursos...${NC}"
    
    # CPU
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
    echo -e "CPU: ${cpu_usage}%"
    
    # Memória
    memory_usage=$(free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2 }')
    echo -e "Memória: ${memory_usage}"
    
    # Disco
    disk_usage=$(df -h / | awk 'NR==2{print $5}')
    echo -e "Disco: ${disk_usage}"
}

# Função para verificar logs de erro
check_error_logs() {
    echo -e "\n${YELLOW}Verificando logs de erro...${NC}"
    
    # Logs do Nginx
    echo -e "\nLogs do Nginx:"
    tail -n 20 /var/log/nginx/error.log
    
    # Logs dos containers
    echo -e "\nLogs dos containers:"
    docker-compose logs --tail=20 | grep -i "error"
}

# Verificar serviços
check_service "Aplicação Principal" "/health"
check_service "Webhook" "/webhook/health"

# Verificar recursos
check_resources

# Verificar logs
check_error_logs

# Verificar SSL
echo -e "\n${YELLOW}Verificando SSL...${NC}"
openssl s_client -connect rastreio.logfastexpress.com:443 -servername rastreio.logfastexpress.com

# Verificar backup
echo -e "\n${YELLOW}Verificando backup...${NC}"
ls -lh backups/

echo -e "\n${GREEN}Monitoramento concluído!${NC}" 