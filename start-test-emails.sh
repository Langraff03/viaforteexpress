#!/bin/bash

# Verificar se o Redis está instalado e em execução
if ! command -v redis-cli &> /dev/null; then
    echo "Redis não está instalado. Por favor, instale o Redis antes de continuar."
    echo "No Ubuntu: sudo apt install redis-server"
    echo "No macOS: brew install redis"
    exit 1
fi

# Verificar se o Redis está em execução
if ! redis-cli ping &> /dev/null; then
    echo "Redis não está em execução. Iniciando o Redis..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start redis
    else
        # Linux
        sudo systemctl start redis
    fi
fi

# Verificar se o ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "ngrok não está instalado. Por favor, instale o ngrok antes de continuar."
    echo "Visite https://ngrok.com/download para instruções de instalação."
    exit 1
fi

# Parar qualquer processo em execução
echo "Parando processos em execução..."
pkill -f "tsx src/webhook-server/index.ts" || true
pkill -f "tsx src/workers/email.worker.ts" || true
pkill -f "tsx src/workers/payment.worker.ts" || true
pkill -f "tsx src/workers/tracking.worker.ts" || true
pkill -f "tsx src/workers/payment-webhook.worker.ts" || true
pkill -f "ngrok http 3001" || true

# Iniciar todos os serviços em terminais separados
echo "Iniciando servidor webhook..."
gnome-terminal -- bash -c "npm run dev:webhook; read -p 'Pressione Enter para fechar...'" || \
xterm -e "npm run dev:webhook; read -p 'Pressione Enter para fechar...'" || \
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev:webhook"' || \
konsole --new-tab -e "npm run dev:webhook; read -p 'Pressione Enter para fechar...'" || \
npm run dev:webhook &

echo "Iniciando worker de email..."
gnome-terminal -- bash -c "npm run dev:email; read -p 'Pressione Enter para fechar...'" || \
xterm -e "npm run dev:email; read -p 'Pressione Enter para fechar...'" || \
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev:email"' || \
konsole --new-tab -e "npm run dev:email; read -p 'Pressione Enter para fechar...'" || \
npm run dev:email &

echo "Iniciando worker de pagamento..."
gnome-terminal -- bash -c "npm run dev:payment; read -p 'Pressione Enter para fechar...'" || \
xterm -e "npm run dev:payment; read -p 'Pressione Enter para fechar...'" || \
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev:payment"' || \
konsole --new-tab -e "npm run dev:payment; read -p 'Pressione Enter para fechar...'" || \
npm run dev:payment &

echo "Iniciando worker de rastreamento..."
gnome-terminal -- bash -c "npm run dev:tracking; read -p 'Pressione Enter para fechar...'" || \
xterm -e "npm run dev:tracking; read -p 'Pressione Enter para fechar...'" || \
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev:tracking"' || \
konsole --new-tab -e "npm run dev:tracking; read -p 'Pressione Enter para fechar...'" || \
npm run dev:tracking &

echo "Iniciando worker de webhook de pagamento..."
gnome-terminal -- bash -c "npm run dev:payment-webhook; read -p 'Pressione Enter para fechar...'" || \
xterm -e "npm run dev:payment-webhook; read -p 'Pressione Enter para fechar...'" || \
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev:payment-webhook"' || \
konsole --new-tab -e "npm run dev:payment-webhook; read -p 'Pressione Enter para fechar...'" || \
npm run dev:payment-webhook &

echo "Iniciando ngrok..."
gnome-terminal -- bash -c "npm run dev:ngrok; read -p 'Pressione Enter para fechar...'" || \
xterm -e "npm run dev:ngrok; read -p 'Pressione Enter para fechar...'" || \
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev:ngrok"' || \
konsole --new-tab -e "npm run dev:ngrok; read -p 'Pressione Enter para fechar...'" || \
npm run dev:ngrok &

echo "Todos os serviços foram iniciados!"
echo "Copie a URL do ngrok e use-a como URL de webhook no gateway de pagamento."
echo "Pressione Ctrl+C para encerrar todos os processos."

# Aguardar até que o usuário pressione Ctrl+C
trap "echo 'Encerrando todos os processos...'; pkill -f 'tsx src/webhook-server/index.ts' || true; pkill -f 'tsx src/workers/email.worker.ts' || true; pkill -f 'tsx src/workers/payment.worker.ts' || true; pkill -f 'tsx src/workers/tracking.worker.ts' || true; pkill -f 'tsx src/workers/payment-webhook.worker.ts' || true; pkill -f 'ngrok http 3001' || true; exit 0" INT
while true; do sleep 1; done