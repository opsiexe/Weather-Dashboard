import { config } from '../config.js';

const API_BASE_URL = config.apiBaseUrl;
const REQUEST_TIMEOUT = 15000; // 15 secondes timeout

/**
 * Fonction utilitaire pour faire des requêtes avec timeout
 * @param {string} url - URL à requêter
 * @param {number} timeout - Timeout en millisecondes
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = async (url, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('La requête a expiré. Veuillez vérifier votre connexion internet.');
    }
    throw error;
  }
};

class WeatherAPI {
  /**
   * Récupère la météo actuelle pour des coordonnées données
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Données météo actuelles
   */
  static async getCurrentWeather(lat, lon) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/weather/current?lat=${lat}&lon=${lon}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Données météo introuvables pour cette localisation.');
        } else if (response.status === 500) {
          throw new Error('Erreur du serveur. Veuillez réessayer plus tard.');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Météo actuelle récupérée:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la météo actuelle:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.');
      }
      throw error;
    }
  }

  /**
   * Récupère les prévisions horaires
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Prévisions horaires
   */
  static async getHourlyForecast(lat, lon) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/weather/hourly?lat=${lat}&lon=${lon}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Prévisions horaires introuvables.');
        } else if (response.status === 500) {
          throw new Error('Erreur du serveur. Veuillez réessayer plus tard.');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Prévisions horaires récupérées:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des prévisions horaires:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Impossible de se connecter au serveur.');
      }
      throw error;
    }
  }

  /**
   * Récupère les prévisions journalières
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Prévisions journalières
   */
  static async getDailyForecast(lat, lon) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/weather/daily?lat=${lat}&lon=${lon}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Prévisions journalières introuvables.');
        } else if (response.status === 500) {
          throw new Error('Erreur du serveur. Veuillez réessayer plus tard.');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Prévisions journalières récupérées:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des prévisions journalières:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Impossible de se connecter au serveur.');
      }
      throw error;
    }
  }

  /**
   * Recherche les coordonnées d'une ville (géocodage direct)
   * @param {string} cityName - Nom de la ville à rechercher
   * @returns {Promise<Object>} Coordonnées de la ville {lat, lon, name}
   */
  static async searchCity(cityName) {
    try {
      if (!cityName || cityName.trim() === '') {
        throw new Error('Veuillez entrer un nom de ville.');
      }

      const response = await fetchWithTimeout(`${API_BASE_URL}/geocoding?city=${encodeURIComponent(cityName)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Ville "${cityName}" introuvable.`);
        } else if (response.status === 500) {
          throw new Error('Erreur du serveur. Veuillez réessayer plus tard.');
        } else if (response.status === 400) {
          throw new Error('Requête invalide. Vérifiez le nom de la ville.');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Résultats de recherche ville:', data);
      
      // Retourne les coordonnées si trouvées
      if (data && data.length > 0) {
        const location = data[0];
        return {
          lat: location.lat,
          lon: location.lon,
          name: location.name,
          country: location.country,
          state: location.state
        };
      }
      
      throw new Error(`Ville "${cityName}" introuvable. Vérifiez l'orthographe.`);
    } catch (error) {
      console.error('Erreur lors de la recherche de ville:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est actif.');
      }
      throw error;
    }
  }

  /**
   * Récupère le nom de la ville à partir des coordonnées (géocodage inverse)
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<string>} Nom de la ville
   */
  static async getCityName(lat, lon) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/geocoding/reverse?lat=${lat}&lon=${lon}`);
      
      if (!response.ok) {
        // En cas d'erreur, on retourne les coordonnées plutôt que d'échouer
        console.warn(`Erreur géocodage inverse ${response.status}, utilisation des coordonnées`);
        return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      }
      
      const data = await response.json();
      console.log('Données de géocodage récupérées:', data);
      
      // Retourne le nom de la ville ou un fallback si pas trouvé
      if (data && data.length > 0) {
        const location = data[0];
        // Construction du nom avec ville, état/région et pays si disponibles
        const parts = [];
        if (location.name) parts.push(location.name);
        if (location.state) parts.push(location.state);
        if (location.country) parts.push(location.country);
        
        return parts.join(', ') || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
      }
      
      return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error);
      // Retourne les coordonnées en cas d'erreur
      return `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    }
  }

  /**
   * Récupère toutes les données météo (actuelle + prévisions)
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<Object>} Toutes les données météo
   */
  static async getAllWeatherData(lat, lon) {
    try {
      const [current, hourly, daily] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.getHourlyForecast(lat, lon),
        this.getDailyForecast(lat, lon)
      ]);

      return {
        current,
        hourly,
        daily,
        coordinates: { lat, lon }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les données météo:', error);
      throw error;
    }
  }

}

export default WeatherAPI;