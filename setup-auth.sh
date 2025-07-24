#!/bin/bash

# =============================================================================
# SCRIPT DE CONFIGURATION DES PROFILS UTILISATEURS - MATHILDE FLEURS
# =============================================================================

echo "🚀 Configuration des profils utilisateurs pour Mathilde Fleurs..."

# Vérifier si le CLI Supabase est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI non trouvé. Installation..."
    npm install -g supabase
fi

# Vérifier si on est dans un projet Supabase
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Projet Supabase non initialisé. Exécutez 'supabase init' d'abord."
    exit 1
fi

# Exécuter le script SQL
echo "📊 Création des tables et fonctions..."
supabase db reset --debug

echo "🔧 Application du schéma des profils..."
supabase db diff --use-migra --schema public --file supabase/migrations/$(date +%Y%m%d%H%M%S)_create_profiles_system.sql

# Ou directement via psql si connecté
# psql -h db.your-project.supabase.co -p 5432 -d postgres -U postgres -f src/sql/profiles-setup.sql

echo "✅ Configuration terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Vérifiez les tables dans votre dashboard Supabase"
echo "2. Configurez les providers OAuth si nécessaire"
echo "3. Testez l'inscription/connexion"
echo ""
echo "🔗 Dashboard: https://app.supabase.com/project/your-project-id"
