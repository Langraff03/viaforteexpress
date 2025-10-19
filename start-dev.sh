#!/bin/bash

# Parar qualquer servidor Vite em execução
echo "Parando servidores Vite em execução..."
pkill -f "vite"

# Iniciar o servidor Vite na porta 3001
echo "Iniciando servidor na porta 3001..."
npm run dev:port