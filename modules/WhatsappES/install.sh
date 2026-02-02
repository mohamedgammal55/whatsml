#!/bin/bash

echo "=========================================="
echo "WhatsApp ES Module - Installation Script"
echo "=========================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ npm n'est pas installé. Veuillez installer Node.js et npm d'abord."
    exit 1
fi

echo "✓ npm trouvé"
echo ""

# Install npm dependencies
echo "📦 Installation des dépendances npm..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances npm"
    exit 1
fi

echo "✓ Dépendances npm installées"
echo ""

# Build assets
echo "🔨 Compilation des assets..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la compilation des assets"
    exit 1
fi

echo "✓ Assets compilés avec succès"
echo ""

# Run migrations
echo "🗄️  Exécution des migrations..."
cd ../..
php artisan whatsapp-es:migrate --force

if [ $? -ne 0 ]; then
    echo "⚠️  Erreur lors de l'exécution des migrations"
    echo "   Vous pouvez les exécuter manuellement avec:"
    echo "   php artisan whatsapp-es:migrate --force"
else
    echo "✓ Migrations exécutées avec succès"
fi

echo ""
echo "=========================================="
echo "✅ Installation terminée!"
echo "=========================================="
echo ""
echo "Le module est maintenant prêt à être utilisé."
echo "Accédez à /admin/whatsapp-es/settings pour configurer."
echo ""
