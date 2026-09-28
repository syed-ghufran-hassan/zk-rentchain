// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  vite: {
    build: { target: 'esnext' },
    optimizeDeps: { esbuildOptions: { target: 'esnext' } },
  },
  css: ['~/assets/styles/globals.css'],

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: false,

  app: {
    head: {
      title: 'RentChain on Mina',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Privacy-preserving RWA rental protocol on Mina Protocol' },
      ],
    },
  },

  // Alias the contracts folder so the UI can import zkApp classes directly
  alias: {
    '@contracts': resolve(currentDir, '../contracts/src'),
  },

  // COOP/COEP headers — required for o1js SharedArrayBuffer
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Cross-Origin-Embedder-Policy': 'require-corp',
        },
      },
    },
  },

  runtimeConfig: {
    public: {
      networkUrl: process.env.VITE_NETWORK_URL || 'https://devnet-plain-1.gcp.o1test.net/graphql',
      propertyNFT: process.env.VITE_PROPERTY_NFT || '',
      rentalHistory: process.env.VITE_RENTAL_HISTORY || '',
      rentalOracle: process.env.VITE_RENTAL_ORACLE || '',
      rentalAgreement: process.env.VITE_RENTAL_AGREEMENT || '',
    },
  },
})