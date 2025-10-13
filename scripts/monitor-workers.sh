#!/bin/bash

# Script de monitoramento dos workers
# Verifica se os workers estão rodando e reinicia se necessário

LOG_FILE="logs/workers-monitor.log"
PID_DIR="logs/pids"

# Criar diretórios se não existirem
mkdir -p logs
mkdir -p $PID_DIR

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Função de log
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
    echo -e "$1"
}

# Verificar se processo está rodando
check_process() {
    local process_name=$1
    local pid_file="$PID_DIR/${process_name}.pid"

    if [ -f "$pid_file" ]; then
        local pid=$(cat $pid_file)
        if ps -p $pid > /dev/null 2>&1; then
            return 0  # Processo está rodando
        else
            log "${RED}Processo $process_name (PID: $pid) não está mais rodando${NC}"
            rm -f $pid_file
            return 1  # Processo parou
        fi
    else
        return 1  # Arquivo PID não existe
    fi
}

# Reiniciar worker
restart_worker() {
    local worker_name=$1
    local worker_command=$2

    log "${YELLOW}Reiniciando $worker_name...${NC}"

    # Matar processo antigo se existir
    local pid_file="$PID_DIR/${worker_name}.pid"
    if [ -f "$pid_file" ]; then
        local old_pid=$(cat $pid_file)
        if ps -p $old_pid > /dev/null 2>&1; then
            kill $old_pid 2>/dev/null
            sleep 2
            if ps -p $old_pid > /dev/null 2>&1; then
                kill -9 $old_pid 2>/dev/null
            fi
        fi
        rm -f $pid_file
    fi

    # Iniciar novo processo em background
    nohup $worker_command > "logs/${worker_name}.log" 2>&1 &
    local new_pid=$!

    # Salvar PID
    echo $new_pid > $pid_file

    log "${GREEN}$worker_name reiniciado (PID: $new_pid)${NC}"
}

# Verificar uso de memória
check_memory() {
    local mem_usage=$(ps aux --no-headers -o pmem | awk '{sum+=$1} END {print sum}')
    local mem_threshold=80  # 80% de uso de memória

    if (( $(echo "$mem_usage > $mem_threshold" | bc -l) )); then
        log "${RED}Uso de memória alto: ${mem_usage}% - pode causar instabilidade${NC}"
        return 1
    fi
    return 0
}

# Verificar Redis
check_redis() {
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            return 0
        else
            log "${RED}Redis não está respondendo${NC}"
            return 1
        fi
    else
        # Se não tem redis-cli, tentar conectar via Node.js
        if node -e "const Redis = require('ioredis'); const r = new Redis(); r.ping().then(() => { r.disconnect(); process.exit(0); }).catch(() => process.exit(1));" &> /dev/null; then
            return 0
        else
            log "${RED}Redis não está acessível${NC}"
            return 1
        fi
    fi
}

# Função principal
main() {
    log "=== Iniciando monitoramento dos workers ==="

    # Verificar Redis
    if ! check_redis; then
        log "${RED}Redis indisponível - pulando verificação dos workers${NC}"
        return 1
    fi

    # Verificar uso de memória
    if ! check_memory; then
        log "${YELLOW}Uso de memória alto detectado${NC}"
    fi

    # Lista de workers para monitorar
    declare -A workers=(
        ["webhook"]="npm run dev:webhook"
        ["payment"]="npm run dev:payment"
        ["email"]="npm run dev:email"
        ["tracking"]="npm run dev:tracking"
        ["payment-webhook"]="npm run dev:payment-webhook"
        ["lead"]="npm run dev:lead"
    )

    local restarted_count=0

    # Verificar cada worker
    for worker_name in "${!workers[@]}"; do
        if ! check_process "$worker_name"; then
            restart_worker "$worker_name" "${workers[$worker_name]}"
            ((restarted_count++))
        else
            log "${GREEN}$worker_name está rodando normalmente${NC}"
        fi
    done

    if [ $restarted_count -gt 0 ]; then
        log "${YELLOW}$restarted_count worker(s) foram reiniciados${NC}"
    else
        log "${GREEN}Todos os workers estão funcionando corretamente${NC}"
    fi

    log "=== Monitoramento concluído ==="
}

# Executar monitoramento
main

# Aguardar um pouco antes de sair para dar tempo dos processos iniciarem
sleep 3