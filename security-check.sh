#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando verificação de segurança...${NC}"

# 1. Verificar headers de segurança
echo -e "\n${YELLOW}Verificando headers de segurança...${NC}"
curl -I https://rapidtransporte.com | grep -i "security"

# 2. Verificar SSL
echo -e "\n${YELLOW}Verificando SSL...${NC}"
openssl s_client -connect rapidtransporte.com:443 -servername rapidtransporte.com

# 3. Verificar firewall
echo -e "\n${YELLOW}Verificando firewall...${NC}"
ufw status

# 4. Verificar permissões
echo -e "\n${YELLOW}Verificando permissões...${NC}"
ls -la /var/www/rapidtransporte
ls -la /etc/nginx/sites-available/rapidtransporte

# 5. Verificar logs
echo -e "\n${YELLOW}Verificando logs...${NC}"
tail -n 50 /var/log/nginx/access.log
tail -n 50 /var/log/nginx/error.log

# 6. Verificar variáveis de ambiente
echo -e "\n${YELLOW}Verificando variáveis de ambiente...${NC}"
grep -v "^#" .env | grep -v "^$"

# 7. Verificar containers
echo -e "\n${YELLOW}Verificando containers...${NC}"
docker-compose ps
docker-compose config

# 8. Verificar rede
echo -e "\n${YELLOW}Verificando rede...${NC}"
docker network inspect rapidtransporte-network

# 9. Verificar volumes
echo -e "\n${YELLOW}Verificando volumes...${NC}"
docker volume ls | grep rapidtransporte

# 10. Verificar processos
echo -e "\n${YELLOW}Verificando processos...${NC}"
ps aux | grep -i "nginx\|docker\|node"

echo -e "\n${GREEN}Verificação de segurança concluída!${NC}" 