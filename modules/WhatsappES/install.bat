@echo off
echo ==========================================
echo WhatsApp ES Module - Installation Script
echo ==========================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X npm n'est pas installe. Veuillez installer Node.js et npm d'abord.
    exit /b 1
)

echo √ npm trouve
echo.

REM Install npm dependencies
echo Installation des dependances npm...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo X Erreur lors de l'installation des dependances npm
    exit /b 1
)

echo √ Dependances npm installees
echo.

REM Build assets
echo Compilation des assets...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo X Erreur lors de la compilation des assets
    exit /b 1
)

echo √ Assets compiles avec succes
echo.

REM Run migrations
echo Execution des migrations...
cd ..\..
php artisan whatsapp-es:migrate --force

if %ERRORLEVEL% NEQ 0 (
    echo ! Erreur lors de l'execution des migrations
    echo   Vous pouvez les executer manuellement avec:
    echo   php artisan whatsapp-es:migrate --force
) else (
    echo √ Migrations executees avec succes
)

echo.
echo ==========================================
echo √ Installation terminee!
echo ==========================================
echo.
echo Le module est maintenant pret a etre utilise.
echo Accedez a /admin/whatsapp-es/settings pour configurer.
echo.

pause
