// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  devtools: { enabled: true },

  runtimeConfig: {
    // --- server only ---
    firebaseProjectId: process.env.NUXT_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
    firebaseClientEmail: process.env.NUXT_FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || '',
    firebasePrivateKey: process.env.NUXT_FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '',
    geminiApiKey: process.env.NUXT_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.NUXT_GEMINI_MODEL || 'gemini-2.5-flash',
    // --- public (sent to client) ---
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
      useEmulator: false,
    },
  },
})
