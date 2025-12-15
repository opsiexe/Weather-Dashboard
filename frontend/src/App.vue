<script setup>
import { ref } from 'vue';
import Dashboard from './components/Dashboard.vue';
import GeoLocationButton from './components/GeoLocationButton.vue';
import Map from './components/Map.vue';

// Références aux composants
const mapRef = ref(null);
const dashboardRef = ref(null);
// Coordonnées météo actuelles
const weatherCoords = ref({ lat: null, lon: null });
// État du dashboard (ouvert/fermé)
const isDashboardOpen = ref(false);

// Fonction déclenchée quand on reçoit les coordonnées du bouton
const handleGeoLocation = ({ lat, lon }) => {
  console.log('🌍 Position utilisateur :', lat, lon)
  weatherCoords.value = { lat, lon };

  // Ouvrir automatiquement le dashboard
  if (dashboardRef.value && dashboardRef.value.openDashboard) {
    dashboardRef.value.openDashboard();
  }
}

// Fonction déclenchée quand on clique sur la carte
const handleMapClick = (coords) => {
  console.log('🗺️ Clic sur la carte :', coords.lat, coords.lng);
  weatherCoords.value = { lat: coords.lat, lon: coords.lng };

  // Ouvrir automatiquement le dashboard
  if (dashboardRef.value && dashboardRef.value.openDashboard) {
    dashboardRef.value.openDashboard();
  }
}

// Fonction déclenchée par la recherche de ville
const handleCoordsUpdate = (coords) => {
  console.log('🔍 Nouvelles coordonnées depuis la recherche:', coords);
  weatherCoords.value = { lat: coords.lat, lon: coords.lon };
}

// Fonction déclenchée quand on veut réinitialiser l'orientation
const handleResetBearing = () => {
  if (mapRef.value) {
    mapRef.value.resetBearing();
  }
}

// Fonction pour gérer l'état du dashboard
const handleDashboardToggle = (isOpen) => {
  isDashboardOpen.value = isOpen;
}
</script>

<template>
  <div id="app" class="h-screen w-screen fixed inset-0 overflow-hidden">
    <Map ref="mapRef" @click-coord="handleMapClick" />
    <transition name="slide-dashboard" mode="out-in">
      <Dashboard ref="dashboardRef" :weather-coords="weatherCoords" @update-coords="handleCoordsUpdate"
        @dashboard-toggle="handleDashboardToggle" />
    </transition>
    <transition name="fade-geo-button">
      <GeoLocationButton v-show="!isDashboardOpen" @get-location="handleGeoLocation"
        @reset-bearing="handleResetBearing" />
    </transition>
  </div>
</template>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  overflow: hidden;
  position: relative;
}

/* Transition pour le dashboard avec effet de glissement */
.slide-dashboard-enter-active,
.slide-dashboard-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-dashboard-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-dashboard-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Transition améliorée pour le bouton de géolocalisation */
.fade-geo-button-enter-active {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-geo-button-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-geo-button-enter-from {
  opacity: 0;
  transform: translateY(-15px) scale(0.9);
}

.fade-geo-button-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.9);
}
</style>