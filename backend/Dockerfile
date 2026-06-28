FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de config des dépendances
COPY package*.json ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./
COPY tsconfig.json ./

# Installer TOUTES les dépendances (dev et prod pour le build)
RUN npm ci

# Copier le code source et builder
COPY src/ ./src/

RUN npm run build

# Régénérer le client Prisma APRÈS le build, dans dist/
RUN npx prisma generate

RUN npm prune --production

# Exposer le port
EXPOSE 3001

# Démarrer : migrations et serveur
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]