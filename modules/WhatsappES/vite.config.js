import laravel from 'laravel-vite-plugin'
import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { manifestPrefixPlugin } from './vite-manifest-plugin.js'

const moduleName = path.basename(__dirname)

export default defineConfig({
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.js')
  },
  build: {
    outDir: 'public/build-modules/' + moduleName,
    emptyOutDir: true,
    manifest: 'manifest.json'
  },
  plugins: [
    laravel({
      publicDirectory: '../../public',
      buildDirectory: 'build-modules/' + moduleName,
      input: [
        __dirname + '/resources/js/app.js'
      ],
      refresh: true,
      hotFile: 'public/' + moduleName + '.hot'
    }),
    vue({
      template: {
        transformAssetUrls: {
          base: null,
          includeAbsolute: false
        }
      }
    }),
    manifestPrefixPlugin(moduleName)
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './../../resources/js/'),
      '@modules': path.resolve(__dirname, '../'),
      '@this': path.resolve(__dirname, './resources/js/'),
      '@root': path.resolve(__dirname, './../../resources/js/')
    }
  }
})
