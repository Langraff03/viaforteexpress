# --- STAGE 1: BUILD ---
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependências de build
RUN apk add --no-cache python3 make g++

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies)
RUN npm install

# Copiar código fonte
COPY . .

# Instalar tipos adicionais necessários
RUN npm install --save-dev @types/react @types/node

# Executar build
RUN npm run build:webhook

# --- STAGE 2: PRODUCTION ---
FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

# Copiar arquivos compilados
COPY --from=builder /app/dist ./dist

# Configurar ambiente
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Comando para iniciar o servidor
CMD ["node", "dist/src/webhook-server/index.js"]