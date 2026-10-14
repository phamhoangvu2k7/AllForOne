export default defineEventHandler(() => {
  const c = useRuntimeConfig()
  return {
    status: 'ok',
    hasProjectId: Boolean(c.firebaseProjectId),
    hasClientEmail: Boolean(c.firebaseClientEmail),
    hasPrivateKey: Boolean(c.firebasePrivateKey),
    keyLength: c.firebasePrivateKey?.length || 0,
    keyStart: c.firebasePrivateKey ? c.firebasePrivateKey.substring(0, 25) : null,
    keyEnd: c.firebasePrivateKey ? c.firebasePrivateKey.substring(c.firebasePrivateKey.length - 25) : null,
  }
})
