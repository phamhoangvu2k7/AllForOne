import { getDb } from '../../utils/firebaseAdmin'

export default defineEventHandler(async (event) => {
  const questionId = String(getQuery(event).questionId ?? '')
  if (!questionId) {
    throw createError({ statusCode: 400, statusMessage: 'bad_request' })
  }

  const db = getDb()
  const snap = await db
    .collection('solutions')
    .where('questionId', '==', questionId)
    .orderBy('votes', 'desc')
    .get()

  return snap.docs.map((d: any) => ({
    id: d.id,
    ...d.data(),
  }))
})

