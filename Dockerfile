# Una sola etapa, solo el API. El build de web/ no existe todavía; la etapa multi-stage
# (con devDependencies para correr Vitest dentro de Docker) se agrega cuando exista el frontend.
# El build context es la raíz del repo, no api/: el .dockerignore vive en la raíz.
FROM node:22-alpine

WORKDIR /app

# Dependencias primero: esta capa se cachea mientras no cambien package.json ni el lockfile.
COPY api/package.json api/package-lock.json ./
RUN npm ci

COPY api/tsconfig.json ./
COPY api/src ./src
RUN npm run build

# Después del npm ci a propósito: con NODE_ENV=production, npm ci saltea las devDependencies
# y tsc no existiría para el build.
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
