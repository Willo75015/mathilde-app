@echo off
REM 🧹 NETTOYAGE COMPLET ANTI-REFRESH (Windows)

echo 🚀 MATHILDE FLEURS - Nettoyage anti-refresh...

REM 1. Arrêter les processus dev
echo ⏹️ Arrêt des processus...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM vite.exe 2>nul

REM 2. Nettoyer les caches Vite
echo 🗑️ Nettoyage caches Vite...
if exist "node_modules\.vite" rmdir /S /Q "node_modules\.vite"
if exist "dist" rmdir /S /Q "dist"
if exist ".vite" rmdir /S /Q ".vite"

REM 3. Vérifier les fichiers de config
echo 🔍 Vérification configs...
if exist "vite.config.ts" (
    echo ✅ vite.config.ts trouvé
) else (
    echo ❌ vite.config.ts manquant !
)

REM 4. Redémarrer proprement
echo 🔄 Installation et redémarrage...
call npm install
start cmd /k "npm run dev"

echo ✅ Nettoyage terminé ! App accessible sur http://localhost:3002
echo 🎯 Si le problème persiste, utiliser le mode debug
pause
