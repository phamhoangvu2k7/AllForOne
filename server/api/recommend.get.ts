import { DEFAULT_USER_RATING } from '../utils/elo'
import { getDb } from '../utils/firebaseAdmin'
import { requireUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const topicId = String(getQuery(event).topicId ?? '')
  if (!topicId) {
    throw createError({ statusCode: 400, statusMessage: 'bad_request' })
  }

  const db = getDb()
  const rSnap = await db.doc(`users/${user.uid}/ratings/${topicId}`).get()
  const r = (rSnap.data()?.rating as number) ?? DEFAULT_USER_RATING

  const [cands, solved] = await Promise.all([
    db
      .collection('questions')
      .where('topicId', '==', topicId)
      .where('status', '==', 'published')
      .where('rating', '>=', r - 100)
      .where('rating', '<=', r + 250)
      .limit(40)
      .get(),
    db.collection(`users/${user.uid}/solved`).where('topicId', '==', topicId).get(),
  ])

  const done = new Set(solved.docs.map((d: any) => d.id))
  let questions = cands.docs
    .filter((d: any) => !done.has(d.id))
    .slice(0, 10)
    .map((d: any) => ({ id: d.id, ...d.data() }))

  // Senior fallback: nếu không có câu trong khoảng hẹp, lấy câu chưa làm bất kỳ trong chuyên đề
  if (questions.length === 0) {
    const all = await db
      .collection('questions')
      .where('topicId', '==', topicId)
      .where('status', '==', 'published')
      .limit(20)
      .get()

    questions = all.docs
      .filter((d: any) => !done.has(d.id))
      .slice(0, 10)
      .map((d: any) => ({ id: d.id, ...d.data() }))
  }

  return { userRating: r, questions }
})

