export default defineEventHandler(async () => {
  try {
    const { getDb } = await import('../utils/firebaseAdmin')
    const db = getDb()
    const snap = await db.collection('topics').limit(1).get()
    return {
      success: true,
      count: snap.size,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack,
    }
  }
})
