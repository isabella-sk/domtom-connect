FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de config des dépendances
COPY package*.json ./
COPY prisma/ ./prisma/
COPY prisma.config.ts ./
COPY tsconfig.json ./

# Installer TOUTES les dépendances (dev et prod pour le build)
RUN npm ci

# Générer le client Prisma AVANT le build (les types sont nécessaires pour tsc)
RUN npx prisma generate

COPY src/ ./src/

RUN npm run build

# Copier le client généré dans dist/ pour qu'il soit accessible au runtime
RUN cp -r src/generated dist/generated

RUN npm prune --production

# Exposer le port
EXPOSE 3001

# Démarrer : migrations et serveur
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]