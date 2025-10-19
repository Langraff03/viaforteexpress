#!/bin/sh
# Verifica se a pasta dist existe
if [ ! -d "dist" ]; then
  echo "❌ Pasta dist não encontrada!"
  exit 1
fi

# Verifica se os arquivos principais existem
if [ ! -f "dist/webhook-server/index.js" ]; then
  echo "❌ Arquivo dist/webhook-server/index.js não encontrado!"
  exit 1
fi

# Verifica se as pastas necessárias existem
if [ ! -d "dist/lib" ]; then
  echo "❌ Pasta dist/lib não encontrada!"
  exit 1
fi

if [ ! -d "dist/routes" ]; then
  echo "❌ Pasta dist/routes não encontrada!"
  exit 1
fi

echo "✅ Verificação de build concluída com sucesso!"
exit 0