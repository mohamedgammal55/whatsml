// WhatsappES Module - Standalone Entry Point
// This file is compiled separately from the main app

import { createApp, h } from 'vue'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createInertiaApp, Link } from '@inertiajs/vue3'
import { Icon } from '@iconify/vue'

// Simple trans function for module
const trans = (key) => {
  return window.trans ? window.trans(key) : key
}

const appName = document.querySelector('meta[name="app-name"]')?.content || 'Laravel'

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) =>
    resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob('./Pages/**/*.vue')),
  setup({ el, App, props, plugin }) {
    return createApp({ render: () => h(App, props) })
      .mixin({ methods: { trans, route: window.route } })
      .component('Link', Link)
      .component('Icon', Icon)
      .use(plugin)
      .mount(el)
  },
  progress: {
    color: '#4F46E5',
    showSpinner: true
  }
})
