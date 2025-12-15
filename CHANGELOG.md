# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [2.0.0] - 2025-12-15

### Ajouté

- Fichier `.env.example` centralisé à la racine du projet avec documentation complète
- Configuration Nginx pour servir le frontend en production
- Fichier `nginx.conf` avec support SPA, compression Gzip et cache des assets
- Volume persistant Redis dans docker-compose pour la persistance des données
- Support multi-stage build pour le frontend (build + serveur Nginx)
- Configuration des hosts autorisés dans vite.config.js
- Headers User-Agent pour les requêtes Nominatim

### Modifié

- Migration de l'API de géocodage OpenWeatherMap vers Nominatim (OpenStreetMap)
- Centralisation de la configuration : `.env` déplacé à la racine (au lieu de `backend/.env`)
- Configuration CORS du backend avec liste blanche des domaines autorisés
- Configuration Docker Compose avec variables d'environnement centralisées
- Ports exposés modifiés : 8742 (backend), 4567 (frontend), 6482 (Redis)
- Frontend Dockerfile utilise maintenant un build multi-stage avec Nginx
- Backend charge maintenant le `.env` depuis le répertoire parent
- Configuration du frontend pour détecter automatiquement l'API URL avec les nouveaux ports
- Image Redis remplacée par redis:7-alpine pour réduire la taille
- Documentation README.md simplifiée et mise à jour

### Supprimé

- Scripts de démarrage automatique `start.bat` et `start.sh`
- Script de validation `backend/validate-env.js`
- Fichiers `.env.example` séparés dans backend/ et frontend/
- Mappings de volumes inutiles dans docker-compose (backend et frontend)
- Dépendance à l'API OpenWeatherMap Geocoding (payante)

### Sécurité

- Configuration CORS restrictive avec liste blanche des origines autorisées
- Configuration allowedHosts dans Vite pour limiter l'accès
- Amélioration de la gestion des erreurs dans les routes d'API
- Suppression des volumes de développement exposant le code source

## [1.0.0] - 2024

### Ajouté

- Application Weather Dashboard initiale
- Backend Node.js avec Express
- Frontend Vue.js avec Vite
- Intégration API OpenWeatherMap
- Cache Redis pour les requêtes météo
- Support WebSocket pour les mises à jour temps réel
- Carte interactive avec Mapbox GL
- Composant de recherche de ville
- Bouton de géolocalisation
- Affichage de la météo actuelle
- Docker et Docker Compose pour le déploiement
- Documentation README complète

---

## Notes de migration v1.0 vers v2.0

### Changements importants

1. **Configuration centralisée**

   - Ancien : `backend/.env` et `frontend/.env`
   - Nouveau : `.env` à la racine du projet
   - Action : Créer `.env` à partir de `.env.example` à la racine

2. **Changement de ports**

   - Ancien : Backend 5000, Frontend 3000, Redis 6379
   - Nouveau : Backend 8742, Frontend 4567, Redis 6482
   - Action : Mettre à jour les URL dans les bookmarks/scripts

3. **API de géocodage**

   - Ancien : OpenWeatherMap Geocoding API
   - Nouveau : Nominatim (OpenStreetMap)
   - Action : Aucune (la clé GEOCODING_API_KEY dans .env n'est plus utilisée mais conservée pour compatibilité)

4. **Frontend en production**
   - Ancien : Serveur de développement Vite
   - Nouveau : Build de production avec Nginx
   - Action : Les changements de code frontend nécessitent un rebuild complet

### Procédure de mise à jour

```bash
# 1. Arrêter les conteneurs existants
docker-compose down

# 2. Récupérer les modifications
git pull origin main

# 3. Créer le nouveau fichier .env
cp .env.example .env

# 4. Éditer .env avec vos clés API
# WEATHER_API_KEY=votre_cle_openweather
# VITE_MAPBOX_ACCESS_TOKEN=votre_token_mapbox

# 5. Rebuild et redémarrer
docker-compose up --build -d
```

### Nouvelles URLs d'accès

- Frontend : http://localhost:4567
- Backend : http://localhost:8742
- Redis : localhost:6482

### Variables d'environnement requises

Voir `.env.example` pour la liste complète et la documentation de chaque variable.

Variables minimales obligatoires :

- `WEATHER_API_KEY` : Clé API OpenWeatherMap
- `VITE_MAPBOX_ACCESS_TOKEN` : Token d'accès Mapbox

---

## Références

- [OpenWeatherMap API](https://openweathermap.org/api)
- [Nominatim API](https://nominatim.org/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Vue.js](https://vuejs.org/)
- [Express](https://expressjs.com/)
