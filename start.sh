#!/bin/bash

# 🚀 Script de démarrage rapide - Application Météo
# Ce script vérifie et démarre l'application avec toutes les validations

echo "=========================================="
echo "   Application Météo - Démarrage"
echo "=========================================="
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_success() {
    echo -e "${GREEN} $1${NC}"
}

print_error() {
    echo -e "${RED} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW} $1${NC}"
}

print_info() {
    echo -e "ℹ  $1"
}

# 1. Vérifier Docker
echo "Vérification de Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé"
    exit 1
fi
print_success "Docker installé"

# 2. Vérifier Docker Compose
echo "Vérification de Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé"
    exit 1
fi
print_success "Docker Compose installé"

# 3. Vérifier le fichier .env
echo ""
echo "Vérification de la configuration..."
if [ ! -f "backend/.env" ]; then
    print_warning "Fichier backend/.env non trouvé"
    print_info "Création à partir de .env.example..."
    cp backend/.env.example backend/.env
    print_warning "IMPORTANT: Éditez backend/.env et ajoutez votre clé API OpenWeather!"
    print_info "   1. Ouvrez backend/.env"
    print_info "   2. Remplacez 'your_openweather_api_key_here' par votre vraie clé"
    print_info "   3. Sauvegardez le fichier"
    echo ""
    read -p "Appuyez sur Entrée quand c'est fait..."
fi
print_success "Fichier .env présent"

# 4. Arrêter les conteneurs existants
echo ""
echo "Arrêt des conteneurs existants..."
docker-compose down > /dev/null 2>&1
print_success "Conteneurs arrêtés"

# 5. Construire les images
echo ""
echo "Construction des images Docker (peut prendre quelques minutes)..."
docker-compose build --no-cache
if [ $? -ne 0 ]; then
    print_error "Erreur lors de la construction"
    exit 1
fi
print_success "Images construites"

# 6. Démarrer les services
echo ""
echo "Démarrage des services..."
docker-compose up -d
if [ $? -ne 0 ]; then
    print_error "Erreur lors du démarrage"
    exit 1
fi
print_success "Services démarrés"

# 7. Attendre que les services soient prêts
echo ""
echo "Attente du démarrage complet..."
sleep 10

# 8. Vérifier l'état des services
echo ""
echo "Vérification de l'état des services..."
docker-compose ps

# 9. Tester le backend
echo ""
echo "Test du backend..."
BACKEND_RESPONSE=$(curl -s http://localhost:5000/ping)
if [ "$BACKEND_RESPONSE" = '{"message":"pong"}' ]; then
    print_success "Backend opérationnel"
else
    print_error "Backend ne répond pas correctement"
    print_info "Vérifiez les logs: docker-compose logs backend"
fi

# 10. Valider l'environnement
echo ""
echo "Validation de l'environnement..."
docker-compose exec -T backend node validate-env.js
VALIDATION_EXIT_CODE=$?

echo ""
echo "=========================================="
if [ $VALIDATION_EXIT_CODE -eq 0 ]; then
    print_success "Démarrage réussi!"
    echo ""
    echo "L'application est prête!"
    echo ""
    echo "Accès:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:5000"
    echo ""
    echo "Commandes utiles:"
    echo "   Voir les logs:     docker-compose logs -f"
    echo "   Arrêter:           docker-compose down"
    echo "   Redémarrer:        docker-compose restart"
    echo ""
    echo "Documentation:"
    echo "   Guide dépannage:   TROUBLESHOOTING.md"
    echo "   Changelog:         CHANGELOG.md"
else
    print_error "Des problèmes ont été détectés"
    echo ""
    echo "Actions recommandées:"
    echo "   1. Vérifiez backend/.env (clés API valides)"
    echo "   2. Consultez TROUBLESHOOTING.md"
    echo "   3. Vérifiez les logs: docker-compose logs -f"
fi
echo "=========================================="
