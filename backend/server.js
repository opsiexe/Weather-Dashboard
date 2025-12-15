import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charge les variables d'environnement depuis le répertoire parent (racine du projet)
dotenv.config({ path: path.resolve(__dirname, '../.env') });


const app = express(); // Création de l'application Express.
app.use(cors()); // Active CORS pour toutes les routes, afin que le frontend puisse appeler le backend.
app.use(express.json()); // Parse automatiquement le corps des requêtes JSON en objet JavaScript.

const redisClient = createClient({ url: process.env.REDIS_URL }); // Création d'un client Redis en utilisant l'URL fournie dans le .env.
redisClient.connect().catch(console.error); // Connexion au serveur Redis. Si erreur, elle est loggée.

app.get('/ping', (req, res) => res.json({ message: 'pong' })); // Route test pour vérifier que le backend fonctionne. Retourne un JSON { message: 'pong' }.

const server = app.listen(process.env.PORT || 5000, () =>
  console.log(`Backend running on port ${process.env.PORT || 5000}`)
); 
// Lancement du serveur HTTP sur le port défini dans .env (ou 5000 par défaut). Log dans la console.

const wss = new WebSocketServer({ server }); // Création d'un serveur WebSocket attaché au serveur HTTP existant.
wss.on('connection', ws => {
  ws.send(JSON.stringify({ message: 'Connected to WebSocket backend' }));
});
// Lorsqu'un client se connecte en WebSocket, lui envoyer un message de confirmation.

const TTL_CURRENT = Number(process.env.CACHE_TTL_CURRENT) || 300; // TTL pour la météo actuelle : durée pendant laquelle les données sont mises en cache (5 minutes par défaut).
const TTL_FORECAST = Number(process.env.CACHE_TTL_FORECAST) || 3600; // TTL pour prévisions horaires/journalières/alertes : durée en cache (1h par défaut).

/**
 * Route : météo actuelle
 */
app.get('/weather/current', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    // Récupère lat/lon depuis les query params.

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Merci de fournir lat et lon en query params' });
    }
    // Vérifie que lat/lon sont présents sinon retourne une erreur 400.

    const cacheKey = `weather:current:${lat}:${lon}`; 
    // Création d'une clé unique pour Redis en fonction de la position.

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("data-from-redis");
      return res.json(JSON.parse(cached));
    }
    // Si les données sont en cache Redis, les retourne immédiatement sans appeler l'API externe.

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=fr`;
    console.log("API-call: ", url);
    // Prépare l'URL pour l'appel API OpenWeatherMap pour les données météo actuelles.

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`OpenWeather API error: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        return res.status(500).json({ error: 'Clé API invalide ou expirée' });
      } else if (response.status === 404) {
        return res.status(404).json({ error: 'Données météo introuvables' });
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'Limite API atteinte' });
      }
      return res.status(502).json({ error: 'Erreur API météo' });
    }

    const data = await response.json();
    // Appelle l'API et récupère les données JSON.

    // Vérifier que les données sont valides
    if (!data || !data.current) {
      return res.status(500).json({ error: 'Données météo invalides' });
    }

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: TTL_CURRENT });
    console.log("Data-stored-in-redis-on:", cacheKey);
    // Stocke les données dans Redis avec TTL pour le cache.

    res.json(data);
    // Renvoie les données au client.
  } catch (error) {
    console.error('Erreur route /weather/current:', error);
    res.status(500).json({ error: 'Impossible de récupérer les données de l\'API' });
    // Gestion des erreurs serveur.
  }
});

/**
 * Route : prévisions horaires
 */
app.get('/weather/hourly', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Merci de fournir lat et lon en query params' });

    const cacheKey = `weather:hourly:${lat}:${lon}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("data-from-redis");
      return res.json(JSON.parse(cached));
    }

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,daily,alerts&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=fr`;
    console.log("API-call: ", url);

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`OpenWeather API error: ${response.status}`);
      if (response.status === 401) return res.status(500).json({ error: 'Clé API invalide' });
      if (response.status === 404) return res.status(404).json({ error: 'Données introuvables' });
      if (response.status === 429) return res.status(429).json({ error: 'Limite API atteinte' });
      return res.status(502).json({ error: 'Erreur API météo' });
    }

    const data = await response.json();
    if (!data || !data.hourly) {
      return res.status(500).json({ error: 'Données invalides' });
    }

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: TTL_FORECAST });
    console.log("Data-stored-in-redis-on:", cacheKey);

    res.json(data);
  } catch (error) {
    console.error('Erreur route /weather/hourly:', error);
    res.status(500).json({ error: 'Impossible de récupérer les données de l\'API' });
  }
});

/**
 * Route : prévisions journalières
 */
app.get('/weather/daily', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Merci de fournir lat et lon en query params' });

    const cacheKey = `weather:daily:${lat}:${lon}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("data-from-redis");
      return res.json(JSON.parse(cached));
    }

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,alerts&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=fr`;
    console.log("API-call: ", url);

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`OpenWeather API error: ${response.status}`);
      if (response.status === 401) return res.status(500).json({ error: 'Clé API invalide' });
      if (response.status === 404) return res.status(404).json({ error: 'Données introuvables' });
      if (response.status === 429) return res.status(429).json({ error: 'Limite API atteinte' });
      return res.status(502).json({ error: 'Erreur API météo' });
    }

    const data = await response.json();
    if (!data || !data.daily) {
      return res.status(500).json({ error: 'Données invalides' });
    }

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: TTL_FORECAST });
    console.log("Data-stored-in-redis-on:", cacheKey);

    res.json(data);
  } catch (error) {
    console.error('Erreur route /weather/daily:', error);
    res.status(500).json({ error: 'Impossible de récupérer les données de l\'API' });
  }
});

/**
 * Route : alertes météo
 */
app.get('/weather/alerts', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Merci de fournir lat et lon en query params' });

    const cacheKey = `weather:alerts:${lat}:${lon}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=current,minutely,hourly,daily&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=fr`;
    console.log("API-call: ", url);

    const response = await fetch(url);
    const data = await response.json();

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: TTL_FORECAST });
    console.log("Data-stored-in-redis-on:", cacheKey);

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Impossible de récupérer les données de l’API' });
  }
});

/**
 * Route : géocodage (ville → coordonnées)
 * Utilise Nominatim car l'API Geocoding OpenWeatherMap nécessite une souscription
 */
app.get('/geocoding', async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'Merci de fournir la ville en query params' });

    const cacheKey = `geocoding:${city}`;
    const cached = await redisClient.get(cacheKey);
    if(cached) return res.json(JSON.parse(cached));

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=1`;
    console.log("API-call: ", url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherDashboard/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`Geocoding API error: ${response.status}`);
      if (response.status === 404) return res.status(404).json({ error: 'Ville introuvable' });
      if (response.status === 429) return res.status(429).json({ error: 'Limite API atteinte' });
      return res.status(502).json({ error: 'Erreur API géocodage' });
    }

    const nominatimData = await response.json();
    
    if (!nominatimData || nominatimData.length === 0) {
      return res.status(404).json({ error: 'Ville introuvable' });
    }

    // Transformer au format OpenWeatherMap pour compatibilité frontend
    const data = nominatimData.map(loc => ({
      name: loc.address?.city || loc.address?.town || loc.address?.village || loc.name || loc.display_name.split(',')[0],
      local_names: {},
      lat: parseFloat(loc.lat),
      lon: parseFloat(loc.lon),
      country: loc.address?.country_code?.toUpperCase() || '',
      state: loc.address?.state || ''
    }));

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: TTL_FORECAST });
    console.log("Data-stored-in-redis-on:", cacheKey);

    res.json(data);
  } catch (error) {
    console.error('Erreur route /geocoding:', error);
    res.status(500).json({ error: 'Impossible de récupérer les données de l\'API' });
  }
});

/**
 * Route : géocodage inverse (coordonnées → ville)
 * Utilise Nominatim car l'API Geocoding OpenWeatherMap nécessite une souscription
 */
app.get('/geocoding/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Merci de fournir la lattitude et la longitude en query params' });

    const cacheKey = `geocoding:reverse:${lat}:${lon}`;
    const cached = await redisClient.get(cacheKey);
    if(cached) return res.json(JSON.parse(cached));

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    console.log("API-call: ", url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WeatherDashboard/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`Geocoding reverse API error: ${response.status}`);
      if (response.status === 404) return res.status(404).json({ error: 'Localisation introuvable' });
      if (response.status === 429) return res.status(429).json({ error: 'Limite API atteinte' });
      return res.status(502).json({ error: 'Erreur API géocodage' });
    }

    const nominatimData = await response.json();
    
    // Transformer au format OpenWeatherMap pour compatibilité frontend
    const data = [{
      name: nominatimData.address?.city || nominatimData.address?.town || nominatimData.address?.village || nominatimData.address?.municipality || 'Localisation inconnue',
      local_names: {},
      lat: parseFloat(nominatimData.lat),
      lon: parseFloat(nominatimData.lon),
      country: nominatimData.address?.country_code?.toUpperCase() || '',
      state: nominatimData.address?.state || nominatimData.address?.region || ''
    }];

    await redisClient.set(cacheKey, JSON.stringify(data), { EX: TTL_FORECAST });
    console.log("Data-stored-in-redis-on:", cacheKey);

    res.json(data);
  } catch (error) {
    console.error('Erreur route /geocoding/reverse:', error);
    res.status(500).json({ error: 'Impossible de récupérer les données de l\'API' });
  }
});
