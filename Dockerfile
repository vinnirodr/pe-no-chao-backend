FROM node:18

WORKDIR /app

# Copiar pacotes primeiro
COPY package*.json ./

# Instala dependências de produção
RUN npm ci --omit=dev

# Copiar o restante do projeto
COPY . .

# Railway define automaticamente a variável PORT
ENV PORT=3001

EXPOSE 3001

CMD ["node", "index.js"]
