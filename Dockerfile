# ============================================================
#  Dockerfile - AJT Frontend (Angular)
#  Multi-stage: builda com Node, serve so os arquivos estaticos com nginx
# ============================================================

# ---------- Stage 1: build ----------
# mesmo node/npm da maquina de dev: o package-lock e gerado pelo npm 11, e o npm 10 do node 22 o ve como "fora de sincronia"
FROM node:24-alpine AS build

WORKDIR /app

# Copia so os manifestos primeiro pra aproveitar o cache das dependencias
COPY package.json package-lock.json ./
# retries: em rede instavel um download cortado nao derruba o build inteiro
RUN npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-maxtimeout=120000

# Agora copia o restante e gera o build de producao (environment.prod.ts: apiUrl = /api)
COPY . .
RUN npm run build -- --configuration production

# ---------- Stage 2: runtime ----------
FROM nginx:1.27-alpine

# A imagem oficial passa os arquivos de /etc/nginx/templates pelo envsubst ao subir:
# AJT_API_UPSTREAM vira o endereco da API pro proxy de /api (no compose, o servico "app")
ENV AJT_API_UPSTREAM=http://app:8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist/ajt-front/browser /usr/share/nginx/html

EXPOSE 80
