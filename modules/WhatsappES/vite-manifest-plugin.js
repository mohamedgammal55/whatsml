import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Plugin Vite pour préfixer les chemins dans le manifest
 * avec le nom du module (ex: modules/WhatsappES/)
 */
export function manifestPrefixPlugin(moduleName) {
  return {
    name: 'manifest-prefix-plugin',
    closeBundle() {
      const manifestPath = path.resolve(__dirname, `public/build-modules/${moduleName}/manifest.json`)
      
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        const prefixedManifest = {}
        
        // Préfixer tous les chemins avec modules/ModuleName/
        for (const [key, value] of Object.entries(manifest)) {
          const newKey = key.startsWith('modules/') ? key : `modules/${moduleName}/${key}`
          const newValue = { ...value }
          
          // Préfixer src si présent
          if (newValue.src && !newValue.src.startsWith('modules/')) {
            newValue.src = `modules/${moduleName}/${newValue.src}`
          }
          
          // Préfixer imports si présent
          if (newValue.imports) {
            newValue.imports = newValue.imports.map(imp => 
              imp.startsWith('modules/') ? imp : `modules/${moduleName}/${imp}`
            )
          }
          
          // Préfixer dynamicImports si présent
          if (newValue.dynamicImports) {
            newValue.dynamicImports = newValue.dynamicImports.map(imp => 
              imp.startsWith('modules/') ? imp : `modules/${moduleName}/${imp}`
            )
          }
          
          prefixedManifest[newKey] = newValue
        }
        
        // Ajouter les CSS communs au manifest (ils sont dans le build principal)
        // Utiliser des chemins absoluts depuis public/
        prefixedManifest['resources/css/app.css'] = {
          file: 'build/assets/app-VUqpxaSo.css',
          src: 'resources/css/app.css',
          isEntry: true
        }
        
        prefixedManifest['resources/scss/admin/main.scss'] = {
          file: 'build/assets/main-DAoytPgP.css',
          src: 'resources/scss/admin/main.scss',
          isEntry: true
        }
        
        // Écrire le manifest modifié
        fs.writeFileSync(manifestPath, JSON.stringify(prefixedManifest, null, 2))
        console.log(`✓ Manifest prefixed with modules/${moduleName}/ and CSS references added`)
      }
    }
  }
}
