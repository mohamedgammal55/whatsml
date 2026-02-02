# 🔌 WhatsApp Embedded Signup Module

Module Laravel pour l'intégration de WhatsApp Embedded Signup avec déploiement automatique des assets.

## ✅ Fonctionnalités

- ✅ **Déploiement automatique** des assets lors de l'activation
- ✅ **CSS chargés correctement** (app.css + main.scss)
- ✅ **Formulaire de configuration** fonctionnel
- ✅ **100% Plug & Play** pour les clients
- ✅ **Pas de configuration manuelle** requise

## 📦 Installation

### Pour les Clients (Plug & Play)

1. Uploadez le module dans `/modules/WhatsappES/`
2. Activez le module via l'interface admin
3. C'est tout ! Les assets sont déployés automatiquement

### Pour les Développeurs

```bash
cd modules/WhatsappES
npm install
npm run build
```

## 🚀 Déploiement

### Préparation

```bash
cd modules/WhatsappES
.\prepare-upload.ps1
```

Cela crée un dossier `upload-ready/WhatsappES/` avec tous les fichiers nécessaires.

### Upload Serveur

1. **FTP** : Uploadez `upload-ready/WhatsappES/` vers `/www/wwwroot/geniusalebot.tech/modules/WhatsappES/`

2. **Fichier Core** : Copiez `resources/views/layouts/Modules.blade.php` vers le serveur

3. **SSH** :
```bash
php artisan module:disable WhatsappES
php artisan module:enable WhatsappES
php artisan cache:clear
```

## 🔧 Architecture Technique

### Fichiers Clés

- **vite-manifest-plugin.js** - Plugin Vite pour préfixer les chemins
- **fix-manifest.js** - Script post-build qui copie les CSS
- **vite.config.js** - Configuration Vite avec alias
- **WhatsappESServiceProvider.php** - Copie automatique des assets

### Workflow de Build

1. `npm run build` exécute `vite build`
2. Vite génère les assets dans `public/build-modules/WhatsappES/`
3. `vite-manifest-plugin.js` préfixe les chemins avec `modules/WhatsappES/`
4. `fix-manifest.js` copie les CSS du build principal et met à jour le manifest
5. Les assets sont prêts pour le déploiement

### Déploiement Automatique

Lors de l'activation du module :
1. `WhatsappESServiceProvider::copyPreCompiledAssets()` est appelé
2. Compare les dates de modification des manifests
3. Supprime les anciens assets si nécessaire
4. Copie les nouveaux assets dans `public/build-modules/WhatsappES/`

## ⚠️ Problème Connu

**Sidebar manquante** : La sidebar (menu latéral) ne s'affiche pas sur la page de configuration.

**Cause** : Le composant Vue n'a pas de layout défini. C'est un problème cosmétique qui n'affecte pas les fonctionnalités.

**Impact** : Le formulaire fonctionne parfaitement, seule l'interface visuelle est simplifiée.

## 📝 Configuration

Accédez à `/admin/whatsapp-es/settings` pour configurer :
- Facebook Client ID
- Facebook Client Secret
- WhatsApp ES Config ID
- Webhook Verify Token

## 🎯 Pour Plus d'Informations

Consultez les documents :
- `GUIDE_DEPLOIEMENT.md` - Guide complet de déploiement
- `GUIDE_TECHNIQUE.md` - Détails techniques et architecture connexion intégrées.

## ✨ Caractéristiques

- ✅ **Installation en 2 clics** - Aucune commande requise
- ✅ **Déploiement automatique** - Assets et migrations automatiques
- ✅ **Zéro configuration technique** - Prêt pour clients non-techniques
- ✅ **Assets pré-compilés** - Pas besoin de Node.js sur le serveur
- ✅ **Menu automatique** - Apparaît automatiquement dans l'admin

## 🚀 Installation (Pour Vos Clients)

### Étape 1 : Upload
Uploadez le dossier `WhatsappES` dans :
```
/www/wwwroot/votre-site/modules/WhatsappES/
```

### Étape 2 : Activation
1. Connectez-vous à l'interface admin
2. Allez dans **Developer Settings → Module List**
3. Cliquez sur **Enable** pour WhatsappES
4. Attendez 2-3 secondes

### C'est Tout ! ✨

Le système fait **automatiquement** :
- ✅ Copie les assets vers `public/build-modules/WhatsappES/`
- ✅ Exécute les migrations de base de données
- ✅ Configure le module
- ✅ Ajoute le menu dans la sidebar

**Aucune commande, aucune compilation, aucune configuration technique !**

## 🔧 Développement (Pour Vous)

### Compiler & Packager

Après avoir modifié le code :

```powershell
cd modules\WhatsappES
.\build-and-package.ps1
```

Ce script fait automatiquement :
- ✅ Compile les assets avec Vite
- ✅ Vérifie que le manifest est correct
- ✅ Copie les assets dans le module
- ✅ Prépare le module pour distribution

### Tester Localement

```bash
php artisan module:disable WhatsappES
php artisan module:enable WhatsappES
```

Les assets sont copiés automatiquement !

## 📋 Configuration

Après l'activation, configurez le module via `/admin/whatsapp-es/settings` :

- **Facebook Client ID**
- **Facebook Client Secret**
- **WhatsApp ES Config ID**
- **Webhook Verify Token**

Ces valeurs sont stockées dans le fichier `.env`.

### 2. Tables de Base de Données

Le module crée les tables suivantes :

- **whatsapp_es_configurations** : Stocke les paramètres de configuration du module
- **whatsapp_es_webhooks** : Enregistre les webhooks reçus de WhatsApp
- **whatsapp_es_messages** : Stocke les messages entrants et sortants

### 3. Configuration Requise

Après l'installation, configurez les paramètres suivants dans l'interface d'administration :

- **Facebook Client ID** : ID client de votre application Facebook
- **Facebook Client Secret** : Secret client de votre application Facebook  
- **WhatsApp ES Config ID** : ID de configuration pour l'inscription intégrée
- **Webhook Verify Token** : Token de vérification pour les webhooks WhatsApp

### 4. Résolution des Problèmes

#### Erreur "Vite manifest not found"

Si vous obtenez l'erreur `Vite manifest not found at: .../public/build-modules/WhatsappES/manifest.json` :

1. **Compilez les assets du module :**
   ```bash
   cd Modules/WhatsappES
   npm install
   npm run build
   ```
   Cela générera les fichiers dans `public/build-modules/WhatsappEs/`.

2. **Vérifiez que le dossier existe :**
   Le dossier `public/build-modules/WhatsappEs/` doit contenir `manifest.json` et les fichiers compilés.

3. **Pour le développement :**
   ```bash
   npm run dev
   ```
   Laissez le serveur Vite tourner en arrière-plan.

#### Migrations ne s'exécutent pas automatiquement

Si les migrations ne s'exécutent pas lors de l'activation du module :

1. Vérifiez que le dossier `database/migrations` contient les fichiers de migration
2. Exécutez manuellement : `php artisan whatsapp-es:migrate --force`
3. Vérifiez les logs Laravel pour les erreurs éventuelles

#### Erreurs de permissions

Assurez-vous que l'utilisateur de la base de données a les permissions pour :
- Créer des tables
- Insérer des données
- Modifier la structure des tables

#### Vérification de l'installation

Pour vérifier que les tables ont été créées correctement :

```sql
SHOW TABLES LIKE 'whatsapp_es_%';
```

### 5. Utilisation

Une fois configuré, le module sera accessible via :
- Interface d'administration : `/admin/whatsapp-es/settings`
- API endpoints pour les webhooks et l'intégration

### 6. Support

En cas de problème, vérifiez :
1. Les logs Laravel (`storage/logs/laravel.log`)
2. Les permissions de base de données
3. La configuration des variables d'environnement
4. Que toutes les dépendances sont installées

## Structure du Module

```
WhatsappES/
├── App/
│   ├── Console/Commands/          # Commandes Artisan
│   ├── Http/Controllers/          # Contrôleurs
│   └── Providers/                 # Service Providers
├── database/
│   └── migrations/                # Migrations de base de données
├── config/                        # Fichiers de configuration
├── resources/                     # Vues et assets
└── routes/                        # Fichiers de routes
```
