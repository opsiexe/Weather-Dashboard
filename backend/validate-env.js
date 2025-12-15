#!/usr/bin/env node

/**
 * Script de validation de l'environnement
 * Vérifie que tous les prérequis sont satisfaits avant de démarrer l'application
 */

import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

const errors = [];
const warnings = [];

console.log('Vérification de l\'environnement...\n');

// 1. Vérifier les variables d'environnement
console.log('Vérification des variables d\'environnement...');

if (!process.env.WEATHER_API_KEY || process.env.WEATHER_API_KEY === 'your_openweather_api_key_here') {
  errors.push('WEATHER_API_KEY n\'est pas définie ou invalide');
} else {
  console.log('WEATHER_API_KEY: Définie');
}

if (!process.env.GEOCODING_API_KEY || process.env.GEOCODING_API_KEY === 'your_geocoding_api_key_here') {
  errors.push('GEOCODING_API_KEY n\'est pas définie ou invalide');
} else {
  console.log('GEOCODING_API_KEY: Définie');
}

if (!process.env.REDIS_URL) {
  errors.push('REDIS_URL n\'est pas définie');
} else {
  console.log('REDIS_URL: Définie');
}

const port = process.env.PORT || 5000;
console.log(`PORT: ${port}`);

// 2. Tester la connexion Redis
console.log('\nVérification de la connexion Redis...');
const redisClient = createClient({ url: process.env.REDIS_URL });

try {
  await redisClient.connect();
  console.log('Connexion Redis: OK');
  await redisClient.disconnect();
} catch (error) {
  errors.push(`Connexion Redis: ÉCHEC - ${error.message}`);
}

// 3. Tester l'API OpenWeatherMap
console.log('\nVérification de l\'API OpenWeatherMap...');

try {
  // Test avec Paris
  const testUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=48.8566&lon=2.3522&exclude=minutely,hourly,daily,alerts&appid=${process.env.WEATHER_API_KEY}&units=metric`;
  
  const response = await fetch(testUrl);
  
  if (response.ok) {
    console.log('API OpenWeatherMap: OK');
  } else if (response.status === 401) {
    errors.push('API OpenWeatherMap: Clé API invalide');
  } else if (response.status === 429) {
    warnings.push('API OpenWeatherMap: Limite de requêtes atteinte');
  } else {
    errors.push(`API OpenWeatherMap: Erreur ${response.status}`);
  }
} catch (error) {
  errors.push(`API OpenWeatherMap: ÉCHEC - ${error.message}`);
}

// 4. Tester l'API de géocodage
console.log('\nVérification de l\'API de géocodage...');

try {
  const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=Paris&limit=1&appid=${process.env.GEOCODING_API_KEY}`;
  
  const response = await fetch(geocodeUrl);
  
  if (response.ok) {
    const data = await response.json();
    if (data && data.length > 0) {
      console.log('API Géocodage: OK');
    } else {
      warnings.push('API Géocodage: Aucun résultat retourné');
    }
  } else if (response.status === 401) {
    errors.push('API Géocodage: Clé API invalide');
  } else if (response.status === 429) {
    warnings.push('API Géocodage: Limite de requêtes atteinte');
  } else {
    errors.push(`API Géocodage: Erreur ${response.status}`);
  }
} catch (error) {
  errors.push(`API Géocodage: ÉCHEC - ${error.message}`);
}

// Affichage du résumé
console.log('\n' + '='.repeat(60));
console.log('RÉSUMÉ DE LA VALIDATION');
console.log('='.repeat(60));

if (warnings.length > 0) {
  console.log('\nAVERTISSEMENTS:');
  warnings.forEach(warning => console.log(warning));
}

if (errors.length > 0) {
  console.log('\nERREURS:');
  errors.forEach(error => console.log(error));
  console.log('\nACTIONS REQUISES:');
  console.log('1. Créez un fichier .env à partir de .env.example');
  console.log('2. Renseignez votre clé API OpenWeatherMap (https://openweathermap.org/api)');
  console.log('3. Assurez-vous que Redis est démarré (docker-compose up redis -d)');
  console.log('\nLe serveur ne peut pas démarrer avec ces erreurs.');
  process.exit(1);
} else {
  console.log('\nToutes les vérifications sont passées!');
  console.log('Le serveur peut démarrer en toute sécurité.');
  
  if (warnings.length > 0) {
    console.log('\nNotez les avertissements ci-dessus.');
  }
  
  process.exit(0);
}
