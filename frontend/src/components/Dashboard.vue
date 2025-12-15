<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SearchBar from './searchBar.vue'
import CurrentWeatherCard from './CurrentWeatherCard.vue'
import WeatherAPI from '../services/weatherAPI.js'

// Props pour recevoir les coordonnées météo
const props = defineProps({
  weatherCoords: {
    type: Object,
    default: () => ({ lat: null, lon: null })
  }
})

// Émissions d'événements
const emit = defineEmits(['update-coords', 'dashboard-toggle'])

const isOpen = ref(false)
const searchValue = ref('')
const searchError = ref(null)
const isSearching = ref(false)

const toggleDashboard = () => {
  isOpen.value = !isOpen.value
  emit('dashboard-toggle', isOpen.value)
  // Réinitialiser l'erreur quand on ferme le dashboard
  if (!isOpen.value) {
    searchError.value = null
  }
}

const openDashboard = () => {
  isOpen.value = true
  emit('dashboard-toggle', true)
}

const handleSearchClick = () => {
  if (!isOpen.value) {
    isOpen.value = true
    emit('dashboard-toggle', true)
  }
}

// Gestion de la recherche de ville
const handleCitySearch = async (cityName) => {
  if (!cityName || cityName.trim() === '') {
    searchError.value = 'Veuillez entrer un nom de ville.'
    return
  }

  isSearching.value = true
  searchError.value = null

  try {
    console.log('🔍 Recherche de ville:', cityName)

    // Rechercher les coordonnées de la ville
    const cityData = await WeatherAPI.searchCity(cityName.trim())

    console.log('📍 Ville trouvée:', cityData)

    // Émettre les nouvelles coordonnées vers le parent (App.vue)
    emit('update-coords', {
      lat: cityData.lat,
      lon: cityData.lon
    })

    // Ouvrir le dashboard si fermé
    if (!isOpen.value) {
      isOpen.value = true
      emit('dashboard-toggle', true)
    }

    // Succès, on efface l'erreur et le champ de recherche
    searchError.value = null
    searchValue.value = ''

  } catch (error) {
    console.error('❌ Erreur recherche ville:', error)
    searchError.value = error.message || 'Une erreur est survenue lors de la recherche.'
  } finally {
    isSearching.value = false
  }
}

const handleKeydown = (event) => {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
    emit('dashboard-toggle', false)
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Exposer les méthodes pour le composant parent
defineExpose({
  openDashboard,
  toggleDashboard
})
</script>

<template>
  <!-- Conteneur principal avec carte en arrière-plan -->
  <div class="relative w-screen h-screen overflow-hidden">

    <!-- Barre de recherche qui s'agrandit en dashboard -->
    <div class="dashboard-container bg-main" :class="{ 'is-open': isOpen }">
      <!-- En-tête avec flèche et barre de recherche -->
      <div :class="[
        'dashboard-header flex flex-col shrink-0',
        'transition-all duration-500 ease-out',
        isOpen ? 'is-open' : 'is-closed'
      ]">
        <!-- Flèche (toujours en haut) -->
        <div v-show="!isOpen" class="chevron-container transition-all duration-500 ease-out flex w-full justify-center">
          <font-awesome-icon icon="chevron-up"
            class="chevron-icon font-bold cursor-pointer transition-all duration-300 text-secon hover:text-text"
            @click="toggleDashboard" />
        </div>

        <!-- Barre de recherche (en dessous) -->
        <div class="search-bar-wrapper" @click="handleSearchClick">
          <SearchBar v-model="searchValue" placeholder="Rechercher une ville"
            :class="isOpen ? 'pointer-events-auto' : ''" :disabled="isSearching" @search="handleCitySearch" />
        </div>

        <!-- Message d'erreur de recherche -->
        <transition name="fade">
          <div v-if="searchError"
            class="error-message mx-4 mt-2 p-3 bg-red-500/90 text-white rounded-lg text-sm flex items-center gap-2 shadow-lg">
            <font-awesome-icon icon="exclamation-circle" class="text-lg" />
            <span>{{ searchError }}</span>
            <button @click="searchError = null" class="ml-auto hover:bg-red-600 p-1 rounded transition-colors">
              <font-awesome-icon icon="times" />
            </button>
          </div>
        </transition>

        <!-- Indicateur de chargement recherche -->
        <transition name="fade">
          <div v-if="isSearching"
            class="loading-message mx-4 mt-2 p-3 bg-blue-500/90 text-white rounded-lg text-sm flex items-center gap-2 shadow-lg">
            <font-awesome-icon icon="circle-notch" spin class="text-lg" />
            <span>Recherche en cours...</span>
          </div>
        </transition>

      </div>

      <!-- Contenu du dashboard qui apparaît après l'animation d'ouverture -->
      <transition name="slide-in-content" mode="out-in">
        <div v-if="isOpen" class="dashboard-content flex-1 overflow-hidden dashboard-padding">
          <div class="content-scroll h-full overflow-hidden">
            <!-- Carte météo actuelle avec animation -->
            <div class="flex justify-start w-full h-full animate-slide-up">
              <CurrentWeatherCard :weather-coords="props.weatherCoords" />
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Overlay sombre quand le dashboard est ouvert -->
    <transition name="fade-overlay">
      <div v-if="isOpen" class="fixed inset-0 bg-black/50 z-40" @click="toggleDashboard"></div>
    </transition>
  </div>
</template>

<style scoped>
/* Animation séquentielle : étape 1 - Redimensionnement + SearchBar (500ms) */
/* Animation séquentielle : étape 2 - Contenu qui apparaît après (délai 500ms + durée 400ms) */

/* Header du dashboard - responsive */
.dashboard-header {
  transition: all 0.5s ease-out;
}

.dashboard-header.is-closed {
  height: 100%;
  padding: 0.5rem 0.25rem;
  justify-content: start;
  gap: 0.5rem;
}

.dashboard-header.is-open {
  padding-top: 0.25rem;
  padding-left: 0.25rem;
  padding-right: 0.75rem;
  padding-bottom: 1rem;
  justify-content: start;
  gap: 0.5rem;
}

/* Container du chevron avec animation fluide */
.chevron-container {
  transition: all 0.5s ease-out;
  flex-shrink: 0;
  height: auto;
  opacity: 1;
}

/* Container du chevron dans le dashboard ouvert - invisible */
.dashboard-header.is-open .chevron-container {
  height: 0;
  min-height: 0;
  opacity: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* Wrapper de la SearchBar - garde une largeur fixe */
.search-bar-wrapper {
  width: 100%;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transition: all 0.5s ease-out;
  flex-shrink: 1;
}

.dashboard-header.is-closed .search-bar-wrapper {
  flex-shrink: 1;
  overflow: hidden;
}

/* Supprimer les marges de la SearchBar quand le dashboard est fermé */
.dashboard-header.is-closed .search-bar-container {
  margin: 0 !important;
}

.chevron-icon {
  font-size: 1.25rem;
}

.dashboard-header.is-closed .search-bar-wrapper {
  flex-shrink: 1;
  min-height: 0;
}

@media (min-width: 640px) {
  .dashboard-header.is-open {
    padding-right: 1.5rem;
    padding-bottom: 1.5rem;
  }

  .chevron-icon {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .dashboard-header.is-closed {
    padding: 0.4rem 0.25rem;
  }

  .chevron-icon {
    font-size: 1.125rem;
  }
}

@media (max-width: 480px) {
  .dashboard-header.is-closed {
    padding: 0.35rem 0.25rem;
  }

  .dashboard-header.is-open {
    padding-bottom: 0.75rem;
  }

  .chevron-icon {
    font-size: 1rem;
  }
}

@media (max-width: 360px) {
  .dashboard-header.is-closed {
    padding: 0.3rem 0.25rem;
  }

  .dashboard-header.is-open {
    padding-bottom: 0.5rem;
  }

  .chevron-icon {
    font-size: 0.95rem;
  }
}

/* Container du dashboard avec animations CSS pures pour éviter les glitches */
.dashboard-container {
  position: fixed;
  z-index: 50;
  display: flex;
  flex-direction: column;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
  bottom: 1.5rem;
  left: 1.5rem;
  width: 25rem;
  height: 6rem;
  max-width: calc(100vw - 3rem);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1), height 0.5s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s ease;
  transform-origin: bottom left;
  overflow: hidden;
  backface-visibility: hidden;
  will-change: width, height, max-width;
  backdrop-filter: blur(8px);
}

.dashboard-container.is-open {
  width: calc(100vw - 2rem);
  height: calc(100vh - 2rem);
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.15);
}

/* Desktop large */
@media (min-width: 1400px) {
  .dashboard-container {
    bottom: 2rem;
    left: 2rem;
  }

  .dashboard-container.is-open {
    width: calc(100vw - 4rem);
    height: calc(100vh - 4rem);
    max-width: 95rem;
    max-height: calc(100vh - 4rem);
  }
}

/* Tablettes horizontales */
@media (max-width: 1024px) {
  .dashboard-container {
    bottom: 1.25rem;
    left: 1.25rem;
    width: 22rem;
    max-width: calc(100vw - 2.5rem);
  }

  .dashboard-container.is-open {
    width: calc(100vw - 2.5rem);
    height: calc(100vh - 2.5rem);
    max-width: calc(100vw - 2.5rem);
    max-height: calc(100vh - 2.5rem);
  }
}

/* Tablettes verticales */
@media (max-width: 768px) {
  .dashboard-container {
    bottom: 1rem;
    left: 1rem;
    width: 20rem;
    max-width: calc(100vw - 2rem);
    height: 5.5rem;
  }

  .dashboard-container.is-open {
    width: calc(100vw - 2rem);
    height: calc(100vh - 2rem);
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
  }
}

/* Mobiles */
@media (max-width: 480px) {
  .dashboard-container {
    bottom: 0.75rem;
    left: 0.75rem;
    right: auto;
    width: calc(100vw - 1.5rem);
    max-width: calc(100vw - 1.5rem);
    border-radius: 0.75rem;
    height: 5rem;
  }

  .dashboard-container.is-open {
    width: calc(100vw - 1.5rem);
    height: calc(100vh - 1.5rem);
    max-width: calc(100vw - 1.5rem);
    max-height: calc(100vh - 1.5rem);
  }
}

/* Petits mobiles */
@media (max-width: 360px) {
  .dashboard-container {
    bottom: 0.5rem;
    left: 0.5rem;
    right: auto;
    width: calc(100vw - 1rem);
    max-width: calc(100vw - 1rem);
    border-radius: 0.625rem;
    height: 4.5rem;
  }

  .dashboard-container.is-open {
    width: calc(100vw - 1rem);
    height: calc(100vh - 1rem);
    max-width: calc(100vw - 1rem);
    max-height: calc(100vh - 1rem);
  }
}

/* Animation du contenu du dashboard - Apparaît APRÈS le redimensionnement */
.slide-in-content-enter-active {
  transition: all 0.4s ease 0.5s;
  /* Délai de 500ms pour attendre la fin du redimensionnement */
}

.slide-in-content-leave-active {
  transition: all 0.1s ease;
  /* Sort très rapidement pour éviter la scrollbar */
  overflow: hidden !important;
}

.slide-in-content-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.slide-in-content-leave-to {
  opacity: 0;
  transform: translateY(10px);
  overflow: hidden !important;
}

/* Classes spécifiques pour masquer le scroll pendant les animations */
.dashboard-content {
  overflow: hidden !important;
}

/* Scrollbar ultra-discrète pour le contenu */
.custom-scrollbar {
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE et Edge */
}

.custom-scrollbar::-webkit-scrollbar {
  width: 0px;
  display: none;
}

.dashboard-padding {
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  padding-bottom: 1rem;
}

@media (min-width: 640px) {
  .dashboard-padding {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    padding-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .dashboard-padding {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
    padding-bottom: 0.75rem;
  }
}

@media (max-width: 360px) {
  .dashboard-padding {
    padding-left: 0.125rem;
    padding-right: 0.125rem;
    padding-bottom: 0.5rem;
  }
}

.slide-in-content-leave-active .content-scroll {
  overflow: hidden !important;
}

.slide-in-content-leave-to .content-scroll {
  overflow: hidden !important;
}

/* Animation du titre et bouton fermer - Apparaît avec le redimensionnement */
.slide-in-title-enter-active {
  transition: all 0.3s ease 0.3s;
  /* Apparaît pendant le redimensionnement */
}

.slide-in-title-leave-active {
  transition: all 0.15s ease;
  /* Sort très rapidement pour éviter les glitches */
}

.slide-in-title-enter-from {
  opacity: 0;
  transform: translateX(-5px);
}

.slide-in-title-leave-to {
  opacity: 0;
  transform: translateX(-5px);
}

/* Animation de l'overlay - Synchronisé avec le redimensionnement */
.fade-overlay-enter-active {
  transition: opacity 0.5s ease;
}

.fade-overlay-leave-active {
  transition: opacity 0.5s ease;
}

.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}

/* Animation de la SearchBar wrapper - Transitions fluides */
.search-bar-wrapper {
  transition: all 0.5s ease-out;
}

/* Transition sur le composant SearchBar lui-même */
.search-bar-wrapper :deep(.search-bar-container) {
  transition: all 0.5s ease-out !important;
}

/* Override du margin de la SearchBar quand fermé pour l'animation fluide */
.dashboard-header.is-closed .search-bar-wrapper {
  margin: 0 !important;
}

.dashboard-header.is-closed .search-bar-wrapper :deep(.search-bar-container) {
  margin: 0 !important;
}

/* Messages d'erreur et de chargement */
.error-message,
.loading-message {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Transition fade pour les messages */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>