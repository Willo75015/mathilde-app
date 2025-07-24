@echo off
echo ===========================================
echo   SETUP SUPABASE - Mathilde Fleurs
echo ===========================================
echo.
echo IMPORTANT: Avant de continuer, assure-toi d'avoir:
echo.
echo 1. Ton projet Supabase "mathilde app" ouvert
echo 2. L'URL et la cle anon de ton projet
echo.
echo Va dans Supabase Dashboard > Settings > API
echo et copie:
echo - Project URL (https://xxxxx.supabase.co)
echo - anon key (eyJhbGc...)
echo.
pause

echo.
echo ===========================================
echo   ETAPES A FAIRE MAINTENANT:
echo ===========================================
echo.
echo 1. CONFIGURER .env
echo    - Ouvre .env dans ton editeur
echo    - Remplace VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
echo.
echo 2. EXECUTER LE SCHEMA SQL
echo    - Va dans Supabase Dashboard > SQL Editor
echo    - Clique sur "New query"
echo    - Copie/colle tout le contenu de supabase/schema.sql
echo    - Clique sur "Run"
echo.
echo 3. ACTIVER L'AUTHENTIFICATION
echo    - Va dans Authentication > Providers
echo    - Active "Email"
echo    - Configure les templates en francais si besoin
echo.
echo 4. VERIFIER RLS
echo    - Va dans Database > Tables
echo    - Verifie que le cadenas est active sur chaque table
echo.
echo 5. TESTER
echo    - Lance l'app avec: npm run dev
echo    - Essaie de creer un compte
echo.
pause

echo.
echo Ouverture du fichier SQL...
start "" "%~dp0supabase\schema.sql"

echo.
echo Ouverture du fichier .env...
start "" "%~dp0.env"

echo.
echo Termine? Lance l'app avec: npm run dev
echo.
pause
