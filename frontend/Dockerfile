FROM node:20

WORKDIR /app

# Accepter les variables d'environnement Vite comme arguments de build
ARG VITE_API_URL
ARG VITE_MAPBOX_ACCESS_TOKEN
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_MAPBOX_ACCESS_TOKEN=${VITE_MAPBOX_ACCESS_TOKEN}

# Copier package.json et package-lock.json pour installer les dépendances
COPY package.json package-lock.json ./

# Installer les dépendances dans le conteneur
RUN npm install

# Copier le reste du projet
COPY . .

EXPOSE 3000

# Lancer le serveur de développement
CMD ["npm", "run", "dev"]