// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  devtools: { enabled: true },

  runtimeConfig: {
    // --- server only ---
    firebaseProjectId: '',
    firebaseClientEmail: '',
    firebasePrivateKey: '',
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    // --- public (sent to client) ---
    public: {
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseAppId: '',
      useEmulator: false,
    },
  },
})
