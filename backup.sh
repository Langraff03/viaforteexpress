#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configurações
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}Iniciando backup...${NC}"

# Backup do Redis
echo -e "${YELLOW}Fazendo backup do Redis...${NC}"
docker-compose exec redis redis-cli SAVE
docker cp $(docker-compose ps -q redis):/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Backup do banco de dados Supabase
echo -e "${YELLOW}Fazendo backup do banco de dados...${NC}"
docker-compose exec db pg_dump -U postgres -d postgres > $BACKUP_DIR/db_$DATE.sql

# Compactar backups
echo -e "${YELLOW}Compactando backups...${NC}"
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/redis_$DATE.rdb $BACKUP_DIR/db_$DATE.sql

# Remover arquivos temporários
rm $BACKUP_DIR/redis_$DATE.rdb $BACKUP_DIR/db_$DATE.sql

# Remover backups antigos
echo -e "${YELLOW}Removendo backups antigos...${NC}"
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Verificar espaço em disco
echo -e "${YELLOW}Verificando espaço em disco:${NC}"
df -h $BACKUP_DIR

echo -e "${GREEN}Backup concluído com sucesso!${NC}"
echo -e "Arquivo de backup: $BACKUP_DIR/backup_$DATE.tar.gz" 