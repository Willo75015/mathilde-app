@echo off
echo Installing Supabase dependencies...

npm install @supabase/supabase-js @supabase/auth-helpers-react

echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Create a Supabase project at app.supabase.com
echo 2. Copy your project URL and anon key
echo 3. Add them to your .env file:
echo    VITE_SUPABASE_URL=your-project-url
echo    VITE_SUPABASE_ANON_KEY=your-anon-key
echo 4. Run the SQL schema in supabase/schema.sql
echo.
pause
