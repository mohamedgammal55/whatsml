# Script PowerShell pour préparer le module WhatsappES pour distribution
# Ce script vérifie que tout est prêt avant de distribuer le module
# Usage: .\prepare-for-distribution.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Préparation Module WhatsappES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Étape 1 : Vérifier que les assets sont compilés
Write-Host "Étape 1/5 : Vérification des assets compilés..." -ForegroundColor Yellow

$assetsDir = "public\build-modules\WhatsappES"
$manifestPath = "$assetsDir\manifest.json"

if (-Not (Test-Path $manifestPath)) {
    $errors += "Manifest non trouvé. Exécutez 'npm run build' d'abord."
    Write-Host "  ✗ Manifest manquant" -ForegroundColor Red
} else {
    Write-Host "  ✓ Manifest trouvé" -ForegroundColor Green
    
    # Vérifier le contenu du manifest
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $hasPrefix = $false
    
    foreach ($key in $manifest.PSObject.Properties.Name) {
        if ($key -like "modules/WhatsappES/*") {
            $hasPrefix = $true
            break
        }
    }
    
    if ($hasPrefix) {
        Write-Host "  ✓ Manifest contient les préfixes corrects" -ForegroundColor Green
    } else {
        $errors += "Manifest ne contient pas les préfixes 'modules/WhatsappES/'"
        Write-Host "  ✗ Manifest sans préfixes" -ForegroundColor Red
    }
}

# Vérifier les fichiers assets
$assetsFiles = Get-ChildItem -Path "$assetsDir\assets" -File -ErrorAction SilentlyContinue
if ($assetsFiles.Count -ge 3) {
    Write-Host "  ✓ Fichiers assets présents ($($assetsFiles.Count) fichiers)" -ForegroundColor Green
} else {
    $errors += "Fichiers assets manquants ou incomplets"
    Write-Host "  ✗ Assets incomplets" -ForegroundColor Red
}

Write-Host ""

# Étape 2 : Vérifier les fichiers critiques
Write-Host "Étape 2/5 : Vérification des fichiers critiques..." -ForegroundColor Yellow

$criticalFiles = @(
    "vite-manifest-plugin.js",
    "vite.config.js",
    "postcss.config.js",
    "package.json",
    "module.json",
    "App\Providers\WhatsappESServiceProvider.php"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        $errors += "Fichier critique manquant: $file"
        Write-Host "  ✗ $file manquant" -ForegroundColor Red
    }
}

Write-Host ""

# Étape 3 : Vérifier module.json
Write-Host "Étape 3/5 : Vérification de module.json..." -ForegroundColor Yellow

if (Test-Path "module.json") {
    $moduleJson = Get-Content "module.json" -Raw | ConvertFrom-Json
    
    if ($moduleJson.accessible -eq $true) {
        Write-Host "  ✓ accessible: true" -ForegroundColor Green
    } else {
        $warnings += "module.json: accessible devrait être true"
        Write-Host "  ⚠ accessible: false (devrait être true)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Étape 4 : Copier les assets dans le module
Write-Host "Étape 4/5 : Copie des assets dans le module..." -ForegroundColor Yellow

if (Test-Path $assetsDir) {
    # Créer le dossier de destination s'il n'existe pas
    $moduleAssetsDir = "public\build-modules\WhatsappES"
    if (-Not (Test-Path $moduleAssetsDir)) {
        New-Item -ItemType Directory -Path $moduleAssetsDir -Force | Out-Null
    }
    
    # Copier tous les fichiers
    Copy-Item -Path "$assetsDir\*" -Destination $moduleAssetsDir -Recurse -Force
    Write-Host "  ✓ Assets copiés dans le module" -ForegroundColor Green
} else {
    $errors += "Dossier assets source non trouvé"
    Write-Host "  ✗ Assets source manquants" -ForegroundColor Red
}

Write-Host ""

# Étape 5 : Vérifier la structure finale
Write-Host "Étape 5/5 : Vérification de la structure finale..." -ForegroundColor Yellow

$expectedStructure = @(
    "public\build-modules\WhatsappES\manifest.json",
    "public\build-modules\WhatsappES\assets"
)

$allPresent = $true
foreach ($path in $expectedStructure) {
    if (Test-Path $path) {
        Write-Host "  ✓ $path" -ForegroundColor Green
    } else {
        $allPresent = $false
        Write-Host "  ✗ $path manquant" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Afficher le résumé
if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✓ Module prêt pour distribution !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Le module contient :" -ForegroundColor Yellow
    Write-Host "  - Assets pré-compilés avec manifest correct" -ForegroundColor Gray
    Write-Host "  - Tous les fichiers critiques" -ForegroundColor Gray
    Write-Host "  - Configuration correcte" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Prochaines étapes :" -ForegroundColor Yellow
    Write-Host "  1. Committez tous les fichiers (y compris les assets)" -ForegroundColor Gray
    Write-Host "  2. Distribuez le module à vos clients" -ForegroundColor Gray
    Write-Host "  3. Vos clients n'auront qu'à uploader et activer !" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Installation client :" -ForegroundColor Yellow
    Write-Host "  1. Upload dans modules/WhatsappES/" -ForegroundColor Gray
    Write-Host "  2. Activation via l'interface admin" -ForegroundColor Gray
    Write-Host "  3. Les assets sont copiés automatiquement !" -ForegroundColor Gray
    
} elseif ($errors.Count -eq 0) {
    Write-Host "⚠ Module prêt avec avertissements" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Avertissements :" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Le module peut être distribué mais vérifiez les avertissements." -ForegroundColor Yellow
    
} else {
    Write-Host "✗ Module NON prêt pour distribution" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erreurs à corriger :" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Actions requises :" -ForegroundColor Yellow
    Write-Host "  1. Exécutez 'npm run build' pour compiler les assets" -ForegroundColor Gray
    Write-Host "  2. Vérifiez que tous les fichiers sont présents" -ForegroundColor Gray
    Write-Host "  3. Relancez ce script" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Afficher les statistiques
Write-Host ""
Write-Host "Statistiques du module :" -ForegroundColor Yellow
$totalSize = 0
Get-ChildItem -Path "public\build-modules\WhatsappES" -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    $totalSize += $_.Length
}
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Host "  - Taille des assets: $totalSizeMB MB" -ForegroundColor Gray

$fileCount = (Get-ChildItem -Path "public\build-modules\WhatsappES" -Recurse -File -ErrorAction SilentlyContinue).Count
Write-Host "  - Nombre de fichiers assets: $fileCount" -ForegroundColor Gray

Write-Host ""
