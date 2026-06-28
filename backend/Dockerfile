FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de config des dépendances
COPY package*.json ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./

# Installer TOUTES les dépendances (dev et prod pour le build)
RUN npm ci

# Générer le client Prisma 7 dans src/generated/prisma
RUN npx prisma generate

# Copier le code source et builder
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

# Garder seulement les dépendances de production
RUN npm prune --production

# Exposer le port
EXPOSE 3001

# Démarrer : migrations et serveur
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]