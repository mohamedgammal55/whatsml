# Script PowerShell pour compiler et packager le module WhatsappES
# Usage: .\build-and-package.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build & Package WhatsappES Module" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Étape 1 : Compiler les assets
Write-Host "Étape 1/3 : Compilation des assets..." -ForegroundColor Yellow
Write-Host ""

try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "✓ Assets compilés avec succès" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur lors de la compilation" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""

# Étape 2 : Vérifier le manifest
Write-Host "Étape 2/3 : Vérification du manifest..." -ForegroundColor Yellow

$manifestPath = "public\build-modules\WhatsappES\manifest.json"
if (Test-Path $manifestPath) {
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $hasPrefix = $false
    
    foreach ($key in $manifest.PSObject.Properties.Name) {
        if ($key -like "modules/WhatsappES/*") {
            $hasPrefix = $true
            break
        }
    }
    
    if ($hasPrefix) {
        Write-Host "✓ Manifest contient les préfixes corrects" -ForegroundColor Green
    } else {
        Write-Host "✗ Manifest ne contient pas les préfixes 'modules/WhatsappES/'" -ForegroundColor Red
        Write-Host "  Vérifiez que vite-manifest-plugin.js est bien configuré" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✗ Manifest non trouvé" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Étape 3 : Copier les assets dans le module
Write-Host "Étape 3/3 : Copie des assets dans le module..." -ForegroundColor Yellow

$sourceDir = "public\build-modules\WhatsappES"
$targetDir = "public\build-modules\WhatsappES"

if (Test-Path $sourceDir) {
    # Créer le dossier cible s'il n'existe pas
    if (-Not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    # Copier tous les fichiers
    Copy-Item -Path "$sourceDir\*" -Destination $targetDir -Recurse -Force
    
    Write-Host "✓ Assets copiés dans le module" -ForegroundColor Green
} else {
    Write-Host "✗ Dossier source non trouvé" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Module prêt pour distribution !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Afficher les statistiques
Write-Host "Fichiers packagés :" -ForegroundColor Yellow
Get-ChildItem -Path $targetDir -Recurse -File | ForEach-Object {
    $size = [math]::Round($_.Length / 1KB, 2)
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\", "")
    Write-Host "  - $relativePath ($size KB)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Prochaines étapes :" -ForegroundColor Yellow
Write-Host "  1. Testez le module localement" -ForegroundColor Gray
Write-Host "  2. Committez les changements (y compris les assets)" -ForegroundColor Gray
Write-Host "  3. Distribuez le module à vos clients" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour vos clients :" -ForegroundColor Yellow
Write-Host "  1. Upload du module dans Modules/" -ForegroundColor Gray
Write-Host "  2. Activation via l'interface admin" -ForegroundColor Gray
Write-Host "  3. C'est tout ! Les assets sont copiés automatiquement" -ForegroundColor Gray
Write-Host ""
