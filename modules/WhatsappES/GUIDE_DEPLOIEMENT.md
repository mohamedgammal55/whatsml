# 🚀 Guide de Déploiement - WhatsappES Module

## 📋 Prérequis

- Accès FTP au serveur
- Accès SSH au serveur
- Module compilé localement (`npm run build`)

## 🎯 Étapes de Déploiement

### 1. Préparation Locale

```bash
cd modules/WhatsappES
.\prepare-upload.ps1
```

**Résultat :**
- Dossier créé : `upload-ready/WhatsappES/`
- Taille : ~0.85 MB
- Tous les fichiers critiques vérifiés ✅

### 2. Upload FTP

**Source :**
```
H:\Didi\Webmaster\geniuspro scripte\geniusalebot.tech\upload-ready\WhatsappES\
```

**Destination :**
```
/www/wwwroot/geniusalebot.tech/modules/WhatsappES/
```

**Fichiers importants à vérifier :**
- ✅ `vite-manifest-plugin.js`
- ✅ `fix-manifest.js`
- ✅ `public/build-modules/WhatsappES/` (dossier complet)
- ✅ `App/Providers/WhatsappESServiceProvider.php`

### 3. Fichier Core (Important !)

⚠️ **Ne pas oublier** : Copier le fichier du core

**Source :**
```
H:\Didi\Webmaster\geniuspro scripte\geniusalebot.tech\resources\views\layouts\Modules.blade.php
```

**Destination :**
```
/www/wwwroot/geniusalebot.tech/resources/views/layouts/Modules.blade.php
```

### 4. Activation SSH

```bash
ssh root@geniusalebot.tech
cd /www/wwwroot/geniusalebot.tech

# Désactiver le module
php artisan module:disable WhatsappES

# Réactiver le module (copie automatique des assets)
php artisan module:enable WhatsappES

# Vider tous les caches
php artisan cache:clear
php artisan view:clear
php artisan config:clear
php artisan route:clear
```

### 5. Vérification

```bash
# Vérifier que les assets sont copiés
ls -la public/build-modules/WhatsappES/
ls -la public/build-modules/WhatsappES/assets/

# Vérifier le manifest
cat public/build-modules/WhatsappES/manifest.json | grep "css"
```

**Vous devez voir :**
```json
"resources/css/app.css": {
  "file": "assets/app-VUqpxaSo.css",
  ...
}
```

### 6. Test Final

1. Ouvrez `/admin/whatsapp-es/settings` dans le navigateur
2. Rechargez avec **Ctrl+Shift+R** (vider le cache)
3. Vérifiez que le formulaire s'affiche correctement
4. Testez la sauvegarde des paramètres

## ✅ Checklist de Déploiement

- [ ] Module compilé localement (`npm run build`)
- [ ] Script `prepare-upload.ps1` exécuté
- [ ] Dossier `upload-ready/WhatsappES/` créé
- [ ] Module uploadé via FTP
- [ ] Fichier `Modules.blade.php` uploadé
- [ ] Module désactivé puis réactivé via SSH
- [ ] Tous les caches vidés
- [ ] Assets présents dans `public/build-modules/WhatsappES/`
- [ ] Manifest contient les CSS
- [ ] Page testée dans le navigateur
- [ ] Formulaire testé (sauvegarde)

## 🔍 Dépannage

### Erreur 404 sur les CSS

**Cause :** Assets non copiés ou manifest incorrect

**Solution :**
```bash
# Vérifier que les assets existent
ls -la public/build-modules/WhatsappES/assets/

# Si manquants, réactiver le module
php artisan module:disable WhatsappES
php artisan module:enable WhatsappES
```

### Page sans style

**Cause :** Cache du navigateur

**Solution :**
- Vider le cache du navigateur (Ctrl+Shift+R)
- Vérifier la console (F12) pour les erreurs

### Module ne s'active pas

**Cause :** Erreur dans le ServiceProvider ou migrations

**Solution :**
```bash
# Vérifier les logs
tail -f storage/logs/laravel.log

# Vérifier les migrations
php artisan migrate:status
```

## 📊 Fichiers Déployés

### Assets (Générés par Build)
- `public/build-modules/WhatsappES/manifest.json` (1199 bytes)
- `public/build-modules/WhatsappES/assets/app-BL7UDPsO.js` (~210 KB)
- `public/build-modules/WhatsappES/assets/app-VUqpxaSo.css` (~93 KB)
- `public/build-modules/WhatsappES/assets/main-BlLTfFbt.css` (~314 KB)
- `public/build-modules/WhatsappES/assets/Setting-PlvawREr.js` (~2.6 KB)
- `public/build-modules/WhatsappES/assets/Signup-B9hdnUk6.js` (~1.9 KB)

### Scripts de Build
- `vite-manifest-plugin.js` (2520 bytes)
- `fix-manifest.js` (2175 bytes)
- `vite.config.js` (1187 bytes)
- `package.json` (570 bytes)

### Code PHP
- `App/Providers/WhatsappESServiceProvider.php`
- `App/Http/Controllers/Admin/SettingsController.php`
- Autres fichiers du module...

## 🎊 Résultat Attendu

Après le déploiement :
- ✅ Module visible dans la liste des modules
- ✅ Menu "WhatsApp ES" dans la sidebar admin
- ✅ Page `/admin/whatsapp-es/settings` accessible
- ✅ Formulaire de configuration visible et stylisé
- ✅ Sauvegarde des paramètres fonctionnelle
- ⚠️ Sidebar manquante (problème cosmétique connu)

**Temps de déploiement estimé : 5-10 minutes**
