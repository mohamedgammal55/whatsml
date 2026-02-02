# 🔧 Guide Technique - WhatsappES Module

## 📐 Architecture

### Vue d'Ensemble

Le module WhatsappES utilise une architecture modulaire Laravel avec Vite pour la compilation des assets frontend.

```
WhatsappES/
├── App/
│   ├── Http/Controllers/
│   └── Providers/
│       └── WhatsappESServiceProvider.php  # Gère le déploiement auto
├── resources/
│   ├── js/
│   │   └── Pages/Admin/Setting.vue        # Composant Vue principal
│   └── views/
├── public/
│   └── build-modules/WhatsappES/          # Assets compilés
│       ├── manifest.json
│       └── assets/
├── vite.config.js                         # Config Vite
├── vite-manifest-plugin.js                # Plugin préfixe chemins
├── fix-manifest.js                        # Script post-build
└── package.json
```

## 🛠️ Système de Build

### Workflow Complet

```
npm run build
    ↓
vite build
    ↓
Génère assets dans public/build-modules/WhatsappES/
    ↓
vite-manifest-plugin.js (pendant le build)
    ├─ Préfixe tous les chemins avec "modules/WhatsappES/"
    └─ Génère manifest.json
    ↓
fix-manifest.js (après le build)
    ├─ Lit le manifest principal (public/build/manifest.json)
    ├─ Copie les CSS (app.css + main.scss) dans assets/
    └─ Met à jour le manifest avec les références CSS
    ↓
Assets prêts pour déploiement
```

### 1. vite-manifest-plugin.js

**Rôle :** Préfixer les chemins dans le manifest avec `modules/WhatsappES/`

**Problème résolu :** `__dirname` non disponible en ESM

**Solution :**
```javascript
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
```

**Fonctionnement :**
- Hook `closeBundle` de Vite
- Lit le manifest généré
- Préfixe tous les chemins (`src`, `file`, `imports`, `dynamicImports`)
- Écrit le manifest modifié

### 2. fix-manifest.js

**Rôle :** Copier les CSS du build principal et mettre à jour le manifest

**Problème résolu :** CSS du core non disponibles dans le module

**Solution :**
```javascript
// Lit le manifest principal
const mainManifest = JSON.parse(fs.readFileSync('../../public/build/manifest.json'))

// Copie les CSS
fs.copyFileSync(sourcePath, destPath)

// Ajoute au manifest du module
manifest['resources/css/app.css'] = {
  file: `assets/${fileName}`,
  src: 'resources/css/app.css',
  isEntry: true
}
```

**Résultat :**
- `app-VUqpxaSo.css` (~93 KB) copié
- `main-BlLTfFbt.css` (~314 KB) copié
- Manifest mis à jour avec les bonnes références

### 3. vite.config.js

**Configuration clé :**

```javascript
export default defineConfig({
  build: {
    outDir: 'public/build-modules/WhatsappES',
    manifest: 'manifest.json'
  },
  plugins: [
    laravel({
      buildDirectory: 'build-modules/WhatsappES',
      input: ['resources/js/app.js']
    }),
    manifestPrefixPlugin('WhatsappES')
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../resources/js/'),
      '@this': path.resolve(__dirname, './resources/js/'),
      '@root': path.resolve(__dirname, '../../resources/js/')
    }
  }
})
```

**Alias importants :**
- `@/` → Ressources du core
- `@this/` → Ressources du module
- `@root/` → Ressources du core (alternatif)

## 🚀 Déploiement Automatique

### WhatsappESServiceProvider.php

**Méthode clé :** `copyPreCompiledAssets()`

**Fonctionnement :**

```php
protected function copyPreCompiledAssets(): void
{
    $sourceDir = module_path($this->name) . '/public/build-modules/WhatsappES';
    $targetDir = public_path('build-modules/WhatsappES');
    
    // Vérifier si mise à jour nécessaire
    if (file_exists($targetManifest) && file_exists($sourceManifest)) {
        $sourceTime = filemtime($sourceManifest);
        $targetTime = filemtime($targetManifest);
        
        if ($sourceTime <= $targetTime) {
            return; // Déjà à jour
        }
    }
    
    // Supprimer les anciens assets
    if (is_dir($targetDir)) {
        $this->recursiveDelete($targetDir);
    }
    
    // Copier les nouveaux assets
    $this->recursiveCopy($sourceDir, $targetDir);
}
```

**Déclenchement :**
- Lors de l'activation du module (`php artisan module:enable WhatsappES`)
- Méthode `boot()` du ServiceProvider

**Avantages :**
- ✅ Pas de commande manuelle
- ✅ Mise à jour automatique si manifest plus récent
- ✅ Suppression des anciens assets
- ✅ Logs informatifs

## 📊 Structure du Manifest

### Manifest du Module

```json
{
  "modules/WhatsappES/resources/js/app.js": {
    "file": "assets/app-BL7UDPsO.js",
    "src": "modules/WhatsappES/resources/js/app.js",
    "isEntry": true
  },
  "resources/css/app.css": {
    "file": "assets/app-VUqpxaSo.css",
    "src": "resources/css/app.css",
    "isEntry": true
  },
  "resources/scss/admin/main.scss": {
    "file": "assets/main-BlLTfFbt.css",
    "src": "resources/scss/admin/main.scss",
    "isEntry": true
  }
}
```

**Points clés :**
- JS du module : chemins préfixés avec `modules/WhatsappES/`
- CSS : fichiers copiés dans `assets/` avec chemins locaux
- Tous les assets accessibles via le manifest

## ⚠️ Problèmes Résolus

### 1. Erreur `__dirname is not defined`

**Cause :** ESM ne définit pas `__dirname` par défaut

**Solution :**
```javascript
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
```

### 2. CSS 404 Not Found

**Cause :** Chemins relatifs `../../build/assets/` non résolus par Vite

**Solution :** Copier les CSS dans le dossier du module

### 3. Assets Non Déployés

**Cause :** ServiceProvider vérifiait seulement l'existence, pas la date

**Solution :** Comparer `filemtime()` des manifests

### 4. Manifest Incorrect

**Cause :** Chemins non préfixés avec `modules/WhatsappES/`

**Solution :** Plugin Vite personnalisé

## 🔍 Debugging

### Vérifier le Build Local

```bash
cd modules/WhatsappES
npm run build

# Vérifier les assets
ls -la public/build-modules/WhatsappES/assets/

# Vérifier le manifest
cat public/build-modules/WhatsappES/manifest.json
```

### Vérifier le Déploiement

```bash
# Sur le serveur
ls -la public/build-modules/WhatsappES/
cat public/build-modules/WhatsappES/manifest.json | grep "css"

# Vérifier les logs
tail -f storage/logs/laravel.log | grep WhatsappES
```

### Console Navigateur

```javascript
// Vérifier les assets chargés
console.log(document.styleSheets)

// Vérifier les erreurs
// F12 → Console → Filtrer "404" ou "css"
```

## 📝 Modifications Futures

### Ajouter un Nouveau Composant Vue

1. Créer le composant dans `resources/js/Pages/`
2. Recompiler : `npm run build`
3. Le manifest sera automatiquement mis à jour

### Ajouter des Styles Personnalisés

**Option 1 :** Ajouter dans le composant Vue
```vue
<style scoped>
/* Styles ici */
</style>
```

**Option 2 :** Créer un fichier CSS séparé
1. Créer `resources/css/custom.css`
2. Ajouter dans `vite.config.js` :
```javascript
input: [
  'resources/js/app.js',
  'resources/css/custom.css'
]
```
3. Recompiler

### Modifier le ServiceProvider

Toute modification du `WhatsappESServiceProvider.php` nécessite :
1. Upload du fichier modifié
2. Désactivation/Réactivation du module
3. Vidage des caches

## 🎯 Bonnes Pratiques

1. **Toujours compiler avant upload**
   ```bash
   npm run build
   .\prepare-upload.ps1
   ```

2. **Vérifier le manifest après build**
   ```bash
   cat public/build-modules/WhatsappES/manifest.json
   ```

3. **Tester localement avant déploiement**
   ```bash
   php artisan module:disable WhatsappES
   php artisan module:enable WhatsappES
   ```

4. **Vider tous les caches après déploiement**
   ```bash
   php artisan cache:clear
   php artisan view:clear
   php artisan config:clear
   ```

## 📚 Ressources

- [Vite Documentation](https://vitejs.dev/)
- [Laravel Vite Plugin](https://laravel.com/docs/vite)
- [Inertia.js](https://inertiajs.com/)
- [Vue 3](https://vuejs.org/)
