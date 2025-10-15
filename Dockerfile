# --- STAGE 1: BUILD ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copia e instala dependências
COPY package*.json ./
RUN npm ci

# Copia o código-fonte
COPY . .

# Executa o build
RUN npm run build:webhook

# --- STAGE 2: PRODUCTION ---
FROM node:18-alpine

WORKDIR /app

# Instala apenas as dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copia os arquivos compilados
COPY --from=builder /app/dist ./dist

# Define variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Comando para iniciar o servidor
CMD ["node", "dist/webhook-server/index.js"]