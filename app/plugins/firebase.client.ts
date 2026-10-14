import { initializeApp, getApps } from 'firebase/app'
import { getAuth, onAuthStateChanged, connectAuthEmulator, type User } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  const c = useRuntimeConfig().public

  let auth: any = null
  let db: any = null

  const user = useState<any>('auth-user', () => null)
  const ready = useState<boolean>('auth-ready', () => false)

  if (c.firebaseApiKey && c.firebaseProjectId) {
    try {
      const app =
        getApps()[0] ??
        initializeApp({
          apiKey: c.firebaseApiKey,
          authDomain: c.firebaseAuthDomain,
          projectId: c.firebaseProjectId,
          appId: c.firebaseAppId,
        })

      auth = getAuth(app)
      db = getFirestore(app)

      if (c.useEmulator) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
        connectFirestoreEmulator(db, '127.0.0.1', 8080)
      }

      onAuthStateChanged(auth, (u) => {
        // Chỉ ghi đè nếu không phải đang dùng demo user
        if (!user.value || !user.value.isDemo) {
          user.value = u
        }
        ready.value = true
      })
    } catch (err) {
      console.warn('Firebase client init warning:', err)
      ready.value = true
    }
  } else {
    // Không có Firebase config, kích hoạt sẵn sàng ở chế độ Demo/Offline
    // Kiểm tra localStorage xem có demo session trước đó không
    try {
      const saved = localStorage.getItem('allforone_demo_user')
      if (saved) {
        user.value = JSON.parse(saved)
      }
    } catch {}
    ready.value = true
  }

  return { provide: { auth, db } }
})

