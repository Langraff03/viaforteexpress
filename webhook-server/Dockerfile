# --- BUILD ---
FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

# Copiar código fonte
COPY . .

# Build
RUN npm run build

# Configurar ambiente
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Iniciar servidor
CMD ["npm", "start"]