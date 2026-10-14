import { getDb, dbNowTimestamp } from '../../../utils/firebaseAdmin'
import { requireUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const cSnap = await db.doc(`contests/${id}`).get()
  if (!cSnap.exists) {
    throw createError({ statusCode: 404, statusMessage: 'not_found' })
  }
  const c = cSnap.data()!

  const now = Date.now()
  const startMs =
    typeof c.startTime?.toMillis === 'function'
      ? c.startTime.toMillis()
      : c.startTime instanceof Date
      ? c.startTime.getTime()
      : typeof c.startTime === 'number'
      ? c.startTime
      : new Date(c.startTime).getTime()

  const endMs =
    typeof c.endTime?.toMillis === 'function'
      ? c.endTime.toMillis()
      : c.endTime instanceof Date
      ? c.endTime.getTime()
      : typeof c.endTime === 'number'
      ? c.endTime
      : new Date(c.endTime).getTime()

  if (now < startMs) {
    throw createError({ statusCode: 403, statusMessage: 'not_started' })
  }
  if (now > endMs) {
    throw createError({ statusCode: 403, statusMessage: 'ended' })
  }

  const pRef = db.doc(`contests/${id}/participants/${user.uid}`)
  const pSnap = await pRef.get()
  if (!pSnap.exists) {
    const u = (await db.doc(`users/${user.uid}`).get()).data()
    await pRef.set({
      displayName: u?.displayName ?? user.name ?? 'Học sinh',
      school: u?.school ?? '',
      startedAt: dbNowTimestamp(),
      score: 0,
      solved: 0,
      lastCorrectAt: null,
    })
  }
  const p = (await pRef.get()).data()!

  const qs = await Promise.all(c.questionIds.map((qid: string) => db.doc(`questions/${qid}`).get()))
  const questions = qs
    .filter((d: any) => d.exists)
    .map((d: any) => {
      // Ẩn rating và thống kê để học sinh không bị thiên kiến trong phòng thi
      const { rating, attempts, correctCount, ...pub } = d.data()!
      return { id: d.id, ...pub }
    })

  const startedAtMs =
    typeof p.startedAt?.toMillis === 'function'
      ? p.startedAt.toMillis()
      : new Date(p.startedAt).getTime()

  return {
    serverNow: Date.now(),
    startedAt: startedAtMs,
    durationMin: c.durationMin as number,
    endTime: endMs,
    questions,
  }
})

