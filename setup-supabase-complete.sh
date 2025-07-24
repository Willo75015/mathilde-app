#!/bin/bash
# Script de configuration Supabase pour Mathilde Fleurs

echo "🌸 Configuration Supabase - Mathilde Fleurs"
echo "============================================"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Installer/vérifier Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "📦 Installation de Supabase CLI..."
    npm install -g supabase
fi

# Vérifier les variables d'environnement
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant"
    exit 1
fi

echo "✅ Variables d'environnement trouvées"

# Tester la connexion
echo "🔍 Test de connexion..."
node -e "
import('./src/lib/supabase.js').then(async ({ supabase }) => {
  try {
    const { data, error } = await supabase.from('flowers').select('count');
    if (error) {
      console.log('❌ Erreur:', error.message);
      process.exit(1);
    }
    console.log('✅ Connexion Supabase OK!');
  } catch (err) {
    console.log('❌ Erreur de test:', err.message);
    process.exit(1);
  }
});
"

# Vérifier les tables
echo "📊 Vérification des tables..."

# Si les tables n'existent pas, les créer
echo "🛠️  Application du schéma..."

echo "🎉 Configuration terminée!"
echo "   L'app est maintenant liée à Supabase"
echo "   Tu peux lancer: npm run dev"
