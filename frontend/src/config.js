// Configuration de l'application
export const config = {
  // Utilise la variable d'environnement VITE_API_URL si définie, sinon détection automatique
  apiBaseUrl: import.meta.env.VITE_API_URL || (() => {
    // Si on est sur localhost, on utilise localhost avec le port exposé
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8742';
    }
    // Sinon on utilise la même IP que le frontend avec le port exposé
    return `http://${window.location.hostname}:8742`;
  })(),
};