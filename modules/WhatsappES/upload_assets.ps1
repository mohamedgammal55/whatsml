# Script PowerShell pour uploader les assets WhatsappES vers le serveur
# Usage: .\upload_assets.ps1

# Configuration - MODIFIEZ CES VALEURS
$SERVER = "geniusalebot.tech"   # Votre serveur
$USER = "root"                   # Votre nom d'utilisateur SSH
$REMOTE_PATH = "/www/wwwroot/geniusalebot.tech/public/build-modules/"

# Chemins locaux
$LOCAL_ASSETS = "..\..\public\build-modules\WhatsappES"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Upload Assets WhatsappES" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que les assets existent localement
if (-Not (Test-Path $LOCAL_ASSETS)) {
    Write-Host "❌ Erreur: Les assets n'existent pas localement!" -ForegroundColor Red
    Write-Host "   Chemin: $LOCAL_ASSETS" -ForegroundColor Yellow
    Write-Host "   Exécutez d'abord: npm run build" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Assets trouvés localement" -ForegroundColor Green
Write-Host ""

# Vérifier que manifest.json existe
$MANIFEST = Join-Path $LOCAL_ASSETS "manifest.json"
if (-Not (Test-Path $MANIFEST)) {
    Write-Host "❌ Erreur: manifest.json n'existe pas!" -ForegroundColor Red
    Write-Host "   Exécutez: npm run build" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ manifest.json trouvé" -ForegroundColor Green
Write-Host ""

# Afficher les fichiers à uploader
Write-Host "Fichiers à uploader:" -ForegroundColor Yellow
Get-ChildItem -Path $LOCAL_ASSETS -Recurse -File | ForEach-Object {
    $size = [math]::Round($_.Length / 1KB, 2)
    Write-Host "  - $($_.Name) ($size KB)" -ForegroundColor Gray
}
Write-Host ""

# Demander confirmation
Write-Host "Serveur: $SERVER" -ForegroundColor Cyan
Write-Host "Utilisateur: $USER" -ForegroundColor Cyan
Write-Host "Destination: ${REMOTE_PATH}WhatsappES/" -ForegroundColor Cyan
Write-Host ""

$confirmation = Read-Host "Voulez-vous continuer? (O/N)"
if ($confirmation -ne 'O' -and $confirmation -ne 'o') {
    Write-Host "Upload annulé." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Upload en cours..." -ForegroundColor Yellow

# Commande SCP
$scpCommand = "scp -r `"$LOCAL_ASSETS`" ${USER}@${SERVER}:${REMOTE_PATH}"

Write-Host "Commande: $scpCommand" -ForegroundColor Gray
Write-Host ""

try {
    # Exécuter SCP
    Invoke-Expression $scpCommand
    
    Write-Host ""
    Write-Host "✓ Upload terminé avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes sur le serveur:" -ForegroundColor Yellow
    Write-Host "  1. ssh ${USER}@${SERVER}" -ForegroundColor Gray
    Write-Host "  2. cd /www/wwwroot/geniusalebot.tech" -ForegroundColor Gray
    Write-Host "  3. php artisan cache:clear" -ForegroundColor Gray
    Write-Host "  4. chmod -R 755 public/build-modules/WhatsappES" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'upload!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifiez que:" -ForegroundColor Yellow
    Write-Host "  - Vous avez accès SSH au serveur" -ForegroundColor Gray
    Write-Host "  - Les identifiants sont corrects" -ForegroundColor Gray
    Write-Host "  - SCP est installé sur votre machine" -ForegroundColor Gray
    exit 1
}
