FROM node:20 AS builder

WORKDIR /app

# Accepter les variables d'environnement Vite comme arguments de build
ARG VITE_API_URL
ARG VITE_MAPBOX_ACCESS_TOKEN

# Copier package.json et package-lock.json
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste du projet
COPY . .

# Build de production avec les variables d'environnement
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_MAPBOX_ACCESS_TOKEN=${VITE_MAPBOX_ACCESS_TOKEN}
RUN npm run build

# Stage 2: Serveur de production avec nginx
FROM nginx:alpine

# Copier les fichiers buildés depuis le stage précédent
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier une configuration nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]