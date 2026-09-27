// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    vite: {
      build: { target: "esnext" },
      optimizeDeps: { esbuildOptions: { target: "esnext" } },
    },
    css: ['~/assets/styles/globals.css'],
  
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
