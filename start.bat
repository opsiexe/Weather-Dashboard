@echo off
REM Script de démarrage rapide - Application Météo (Windows)
REM Ce script vérifie et démarre l'application avec toutes les validations

setlocal enabledelayedexpansion

echo ==========================================
echo       Application Météo - Démarrage
echo ==========================================
echo.

REM 1. Vérifier Docker
echo [1/10] Vérification de Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker n'est pas installé
    pause
    exit /b 1
)
echo [OK] Docker installé

REM 2. Vérifier Docker Compose
echo [2/10] Vérification de Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker Compose n'est pas installé
    pause
    exit /b 1
)
echo [OK] Docker Compose installé

REM 3. Vérifier le fichier .env
echo.
echo [3/10] Vérification de la configuration...
if not exist "backend\.env" (
    echo [ATTENTION] Fichier backend\.env non trouvé
    echo Creation à partir de .env.example...
    copy backend\.env.example backend\.env >nul
    echo.
    echo ==========================================
    echo  IMPORTANT: Configuration requise
    echo ==========================================
    echo 1. Ouvrez backend\.env dans un éditeur
    echo 2. Remplacez 'your_openweather_api_key_here' par votre vraie clé API
    echo 3. Sauvegardez le fichier
    echo 4. Revenez ici et appuyez sur une touche
    echo.
    echo Obtenez votre clé sur: https://openweathermap.org/api
    echo ==========================================
    pause
)
echo [OK] Fichier .env présent

REM 4. Arrêter les conteneurs existants
echo.
echo [4/10] Arrêt des conteneurs existants...
docker-compose down >nul 2>&1
echo [OK] Conteneurs arrêtés

REM 5. Construire les images
echo.
echo [5/10] Construction des images Docker...
echo (peut prendre quelques minutes la première fois)
docker-compose build --no-cache
if errorlevel 1 (
    echo [ERREUR] Erreur lors de la construction
    pause
    exit /b 1
)
echo [OK] Images construites

REM 6. Démarrer les services
echo.
echo [6/10] Démarrage des services...
docker-compose up -d
if errorlevel 1 (
    echo [ERREUR] Erreur lors du démarrage
    pause
    exit /b 1
)
echo [OK] Services démarrés

REM 7. Attendre que les services soient prêts
echo.
echo [7/10] Attente du démarrage complet...
timeout /t 10 /nobreak >nul
echo [OK] Délai écoulé

REM 8. Vérifier l'état des services
echo.
echo [8/10] Vérification de l'état des services...
docker-compose ps

REM 9. Tester le backend
echo.
echo [9/10] Test du backend...
curl -s http://localhost:5000/ping >nul 2>&1
if errorlevel 1 (
    echo [ATTENTION] Backend ne répond pas encore
    echo Vérifiez les logs: docker-compose logs backend
) else (
    echo [OK] Backend opérationnel
)

REM 10. Valider l'environnement
echo.
echo [10/10] Validation de l'environnement...
docker-compose exec -T backend node validate-env.js
set VALIDATION_EXIT_CODE=!errorlevel!

echo.
echo ==========================================
if !VALIDATION_EXIT_CODE! equ 0 (
    echo  Démarrage réussi!
    echo ==========================================
    echo.
    echo L'application est prête!
    echo.
    echo Accès:
    echo   Frontend: http://localhost:3000
    echo   Backend:  http://localhost:5000
    echo.
    echo Commandes utiles:
    echo   Voir les logs:     docker-compose logs -f
    echo   Arrêter:           docker-compose down
    echo   Redémarrer:        docker-compose restart
    echo.
    echo Documentation:
    echo   Guide dépannage:   TROUBLESHOOTING.md
    echo   Changelog:         CHANGELOG.md
) else (
    echo  Des problèmes ont été détectés
    echo ==========================================
    echo.
    echo Actions recommandées:
    echo   1. Vérifiez backend\.env (clés API valides)
    echo   2. Consultez TROUBLESHOOTING.md
    echo   3. Vérifiez les logs: docker-compose logs -f
    echo   4. Exécutez: docker-compose restart
)
echo ==========================================
echo.
pause
