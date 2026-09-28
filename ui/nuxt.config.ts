 
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  vite: {
    build: { target: 'esnext' },
  },
  css: ['~/assets/styles/globals.css'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  // NOTE: No nitro.preset — we want plain static output to .output/public

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

  alias: {
    '@contracts': resolve(currentDir, './contracts-src'),
  },

  runtimeConfig: {
    public: {
      networkUrl: process.env.VITE_NETWORK_URL || 'https://devnet-plain-1.gcp.o1test.net/graphql',
      propertyNFT: process.env.VITE_PROPERTY_NFT || 'B62qouAdEAptokm6QTPeXA6TFtd4ovRxT7KwyY8GYa9VgNFusCLSbbu',
      rentalHistory: process.env.VITE_RENTAL_HISTORY || 'B62qnJ3FrEpP6YabWFXJ4dmZ2jYRRAQ8kM5au9DVmiH8eoZc6JKnvq6',
      rentalOracle: process.env.VITE_RENTAL_ORACLE || 'B62qq69rKhFP8upJqws4keopDbh5vxep85dXRFR2i2W51ZvmomqHegw',
      rentalAgreement: process.env.VITE_RENTAL_AGREEMENT || 'B62qmMYBtthZSZ1APbfGhLwg118hHoeLt1W15eU2ar4qjqYZQ84LTGg',
    },
  },
})
 