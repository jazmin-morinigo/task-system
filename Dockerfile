# Multi-stage: la imagen final sirve el build de React como estático desde Express, mismo
# puerto que el API. Build context = raíz del repo (no api/ ni web/): el .dockerignore vive ahí.

# --- Frontend: compila el build de Vite ---
FROM node:24-alpine AS web-build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# --- API: dependencias con devDependencies (las necesitan tsc y la etapa de test) ---
FROM node:24-alpine AS api-deps
WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci

# --- API: compila con tsc ---
FROM api-deps AS api-build
COPY api/tsconfig.json ./
COPY api/src ./src
RUN npm run build

# --- API: etapa de test, conserva las devDependencies para correr Vitest dentro de Docker ---
FROM api-deps AS test
COPY api/tsconfig.json ./
COPY api/src ./src
CMD ["npm", "test"]

# --- Imagen final: solo deps de producción + JS compilado + estático del frontend ---
FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# --omit=dev explícito: no depender de que NODE_ENV=production alcance para que npm salte las
# devDependencies (con las versiones de npm en node:24-alpine ese comportamiento implícito no es
# confiable).
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=api-build /app/dist ./dist
COPY --from=web-build /app/web/dist ./web-dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
