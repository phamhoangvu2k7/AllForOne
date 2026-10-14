import { getApps, initializeApp, cert, type App } from 'firebase-admin/app'
import { getFirestore, FieldValue as AdminFieldValue, Timestamp as AdminTimestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { mockDb } from './localStore'

export function isFirebaseConfigured(): boolean {
  if (process.env.FIRESTORE_EMULATOR_HOST) return true
  try {
    const c = useRuntimeConfig()
    return Boolean(c.firebaseProjectId && c.firebaseClientEmail && c.firebasePrivateKey)
  } catch {
    return false
  }
}

function getAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const c = useRuntimeConfig()

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: c.public.firebaseProjectId || 'demo-allforone' })
  }

  if (c.firebaseProjectId && c.firebaseClientEmail && c.firebasePrivateKey) {
    return initializeApp({
      credential: cert({
        projectId: c.firebaseProjectId,
        clientEmail: c.firebaseClientEmail,
        privateKey: c.firebasePrivateKey.replace(/\\n/g, '\n'),
      }),
    })
  }

  return initializeApp({ projectId: 'demo-allforone' })
}

export const getDb = () => {
  if (isFirebaseConfigured()) {
    return getFirestore(getAdminApp())
  }
  return mockDb as any
}

export const getAdminAuth = () => getAuth(getAdminApp())

export const dbTimestamp = () => {
  if (isFirebaseConfigured()) {
    return AdminFieldValue.serverTimestamp()
  }
  return { __op: 'timestamp' }
}

export const dbIncrement = (n: number) => {
  if (isFirebaseConfigured()) {
    return AdminFieldValue.increment(n)
  }
  return { __op: 'increment', amount: n }
}

export const dbNowTimestamp = () => {
  if (isFirebaseConfigured()) {
    return AdminTimestamp.now()
  }
  return new Date()
}

