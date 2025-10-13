#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Iniciando procedimento de rollback...${NC}"

# 1. Parar todos os containers
echo -e "\n${YELLOW}Parando containers...${NC}"
docker-compose down

# 2. Restaurar backup mais recente
echo -e "\n${YELLOW}Restaurando backup...${NC}"
LATEST_BACKUP=$(ls -t backups/backup_*.tar.gz | head -n1)
if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}Nenhum backup encontrado!${NC}"
    exit 1
fi

# Extrair backup
tar -xzf $LATEST_BACKUP -C /tmp

# Restaurar Redis
echo -e "\n${YELLOW}Restaurando Redis...${NC}"
docker-compose up -d redis
sleep 5
docker cp /tmp/dump.rdb rapidtransporte_redis_1:/data/
docker-compose restart redis

# Restaurar banco de dados
echo -e "\n${YELLOW}Restaurando banco de dados...${NC}"
docker-compose up -d db
sleep 10
docker cp /tmp/db_*.sql rapidtransporte_db_1:/tmp/
docker-compose exec db psql -U postgres -d postgres -f /tmp/db_*.sql

# 3. Restaurar versão anterior do código
echo -e "\n${YELLOW}Restaurando versão anterior do código...${NC}"
git reset --hard HEAD^
git clean -fd

# 4. Reconstruir imagens
echo -e "\n${YELLOW}Reconstruindo imagens...${NC}"
docker-compose build

# 5. Iniciar serviços
echo -e "\n${YELLOW}Iniciando serviços...${NC}"
docker-compose up -d

# 6. Verificar status
echo -e "\n${YELLOW}Verificando status...${NC}"
docker-compose ps
docker-compose logs --tail=50

# 7. Limpar arquivos temporários
echo -e "\n${YELLOW}Limpando arquivos temporários...${NC}"
rm -rf /tmp/dump.rdb /tmp/db_*.sql

echo -e "\n${GREEN}Rollback concluído!${NC}" 