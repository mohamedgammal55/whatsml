import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Lire le manifest du module
const manifestPath = path.resolve(__dirname, 'public/build-modules/WhatsappES/manifest.json')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

// Lire le manifest principal pour récupérer les vrais noms de fichiers CSS
const mainManifestPath = path.resolve(__dirname, '../../public/build/manifest.json')
const moduleAssetsDir = path.resolve(__dirname, 'public/build-modules/WhatsappES/assets')

if (fs.existsSync(mainManifestPath)) {
  const mainManifest = JSON.parse(fs.readFileSync(mainManifestPath, 'utf-8'))
  
  // Copier les CSS du build principal vers le build du module
  if (mainManifest['resources/css/app.css']) {
    const cssFile = mainManifest['resources/css/app.css'].file
    const sourcePath = path.resolve(__dirname, '../../public/build', cssFile)
    const fileName = path.basename(cssFile)
    const destPath = path.join(moduleAssetsDir, fileName)
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath)
      manifest['resources/css/app.css'] = {
        file: `assets/${fileName}`,
        src: 'resources/css/app.css',
        isEntry: true
      }
      console.log(`✓ Copied app.css: ${fileName}`)
    }
  }
  
  if (mainManifest['resources/scss/admin/main.scss']) {
    const cssFile = mainManifest['resources/scss/admin/main.scss'].file
    const sourcePath = path.resolve(__dirname, '../../public/build', cssFile)
    const fileName = path.basename(cssFile)
    const destPath = path.join(moduleAssetsDir, fileName)
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath)
      manifest['resources/scss/admin/main.scss'] = {
        file: `assets/${fileName}`,
        src: 'resources/scss/admin/main.scss',
        isEntry: true
      }
      console.log(`✓ Copied main.scss: ${fileName}`)
    }
  }
}

// Écrire le manifest modifié
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
console.log('✓ Manifest fixed with CSS references')
