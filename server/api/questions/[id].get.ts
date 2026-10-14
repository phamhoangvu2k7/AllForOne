import { getDb } from '../../utils/firebaseAdmin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const snap = await db.doc(`questions/${id}`).get()
  if (!snap.exists) {
    throw createError({ statusCode: 404, statusMessage: 'question_not_found' })
  }

  const data = snap.data()!
  // Đảm bảo không bao giờ để lộ accepted và explanation
  const { accepted, explanation, ...pub } = data

  return {
    id: snap.id,
    ...pub,
  }
})

