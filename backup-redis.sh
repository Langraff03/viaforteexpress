#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configurações
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/redis_backup_$DATE.rdb"

echo -e "${YELLOW}Iniciando backup do Redis...${NC}"

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Fazer backup do Redis
echo -e "${YELLOW}Gerando dump do Redis...${NC}"
if docker-compose exec redis redis-cli SAVE; then
    echo -e "${GREEN}✓ Dump gerado com sucesso${NC}"
else
    echo -e "${RED}✗ Erro ao gerar dump${NC}"
    exit 1
fi

# Copiar arquivo de backup
echo -e "${YELLOW}Copiando arquivo de backup...${NC}"
if docker cp $(docker-compose ps -q redis):/data/dump.rdb $BACKUP_FILE; then
    echo -e "${GREEN}✓ Backup copiado para $BACKUP_FILE${NC}"
else
    echo -e "${RED}✗ Erro ao copiar backup${NC}"
    exit 1
fi

# Limpar backups antigos (manter últimos 7 dias)
echo -e "${YELLOW}Limpando backups antigos...${NC}"
find $BACKUP_DIR -name "redis_backup_*.rdb" -mtime +7 -delete

echo -e "${GREEN}Backup concluído com sucesso!${NC}"
echo -e "${YELLOW}Arquivo de backup: $BACKUP_FILE${NC}" 