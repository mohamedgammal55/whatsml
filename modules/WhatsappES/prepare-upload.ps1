# Script pour préparer le module pour upload
# Crée un dossier avec TOUS les fichiers nécessaires

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Préparation Upload WhatsappES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Créer le dossier de destination
$uploadDir = "..\..\upload-ready\WhatsappES"
if (Test-Path $uploadDir) {
    Remove-Item -Recurse -Force $uploadDir
}
New-Item -ItemType Directory -Path $uploadDir -Force | Out-Null

Write-Host "Copie des fichiers..." -ForegroundColor Yellow
Write-Host ""

# Copier tout le module
Copy-Item -Path ".\*" -Destination $uploadDir -Recurse -Force -Exclude @("node_modules", "*.hot")

Write-Host "✓ Module copié" -ForegroundColor Green
Write-Host ""

# Vérifier les fichiers critiques
Write-Host "Vérification des fichiers critiques..." -ForegroundColor Yellow
Write-Host ""

$criticalFiles = @(
    "vite-manifest-plugin.js",
    "fix-manifest.js",
    "vite.config.js",
    "package.json",
    "public\build-modules\WhatsappES\manifest.json"
)

$allPresent = $true
foreach ($file in $criticalFiles) {
    $fullPath = Join-Path $uploadDir $file
    if (Test-Path $fullPath) {
        $size = (Get-Item $fullPath).Length
        Write-Host "  ✓ $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MANQUANT" -ForegroundColor Red
        $allPresent = $false
    }
}

Write-Host ""

if ($allPresent) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✓ Module prêt pour upload !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Dossier créé :" -ForegroundColor Yellow
    Write-Host "  $((Resolve-Path $uploadDir).Path)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Prochaines étapes :" -ForegroundColor Yellow
    Write-Host "  1. Uploadez le contenu de ce dossier vers :" -ForegroundColor Gray
    Write-Host "     /www/wwwroot/geniusalebot.tech/modules/WhatsappES/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. SSH :" -ForegroundColor Gray
    Write-Host "     php artisan module:disable WhatsappES" -ForegroundColor Gray
    Write-Host "     php artisan module:enable WhatsappES" -ForegroundColor Gray
    Write-Host "     php artisan cache:clear" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✗ Fichiers manquants !" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    exit 1
}

# Afficher la taille totale
$totalSize = (Get-ChildItem -Path $uploadDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Host "Taille totale : $totalSizeMB MB" -ForegroundColor Gray
Write-Host ""
