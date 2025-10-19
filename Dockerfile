FROM node:18-slim
WORKDIR /app

# Copia pacote e instala dependências
COPY package*.json ./
RUN npm ci

# Copia apenas os arquivos necessários
COPY dist ./dist
RUN ls -lR ./dist

# Ambiente e porta
ENV NODE_ENV=production
EXPOSE 3001

# Comando padrão (será sobrescrito pelo docker-compose)
CMD ["node", "dist/webhook-server/webhook-server/index.js"]