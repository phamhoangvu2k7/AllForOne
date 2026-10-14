import { getDb } from '../../utils/firebaseAdmin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const snap = await db.doc(`contests/${id}`).get()
  if (!snap.exists) {
    throw createError({ statusCode: 404, statusMessage: 'not_found' })
  }

  const data = snap.data()!
  const startMs =
    typeof data.startTime?.toMillis === 'function'
      ? data.startTime.toMillis()
      : new Date(data.startTime).getTime()
  const endMs =
    typeof data.endTime?.toMillis === 'function'
      ? data.endTime.toMillis()
      : new Date(data.endTime).getTime()
  const now = Date.now()

  let status = 'scheduled'
  if (now >= startMs && now <= endMs) {
    status = 'running'
  } else if (now > endMs) {
    status = 'finished'
  }

  return {
    id: snap.id,
    title: data.title,
    subject: data.subject,
    description: data.description || '',
    durationMin: data.durationMin,
    startTime: startMs,
    endTime: endMs,
    questionCount: data.questionIds?.length || 0,
    status,
  }
})

