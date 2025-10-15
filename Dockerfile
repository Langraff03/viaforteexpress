# --- STAGE 1: BUILD ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copia e instala dependências
COPY package*.json ./
RUN npm ci

# Copia o código-fonte
COPY . .

# Executa o build (cria a pasta 'dist')
# Use o comando que compila tudo (webhook e workers)
RUN npm run build:webhook


# --- STAGE 2: PRODUCTION ---
FROM node:18-alpine

WORKDIR /app

# Copia apenas os arquivos necessários para rodar
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Ambiente e porta
ENV NODE_ENV=production
EXPOSE 3001

# Comando padrão (será sobrescrito pelo Railway)
CMD ["node", "dist/webhook-server/webhook-server/index.js"]