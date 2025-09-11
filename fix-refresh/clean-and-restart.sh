#!/bin/bash
# 🧹 NETTOYAGE COMPLET ANTI-REFRESH

echo "🚀 MATHILDE FLEURS - Nettoyage anti-refresh..."

# 1. Arrêter tous les processus dev
echo "⏹️ Arrêt des processus..."
pkill -f "vite"
pkill -f "node.*3002"

# 2. Nettoyer les caches Vite
echo "🗑️ Nettoyage caches Vite..."
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite

# 3. Nettoyer les caches navigateur (si possible)
echo "🌐 Nettoyage données navigateur..."
# Note: Doit être fait manuellement dans le navigateur

# 4. Vérifier les fichiers de config
echo "🔍 Vérification configs..."
if [ -f "vite.config.ts" ]; then
    echo "✅ vite.config.ts trouvé"
else
    echo "❌ vite.config.ts manquant !"
fi

# 5. Redémarrer proprement
echo "🔄 Redémarrage..."
npm install
npm run dev &

echo "✅ Nettoyage terminé ! App accessible sur http://localhost:3002"
echo "🎯 Si le problème persiste, utiliser le mode debug"
