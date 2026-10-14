import { DEFAULT_USER_RATING, DIFFICULTY_BASE } from '../utils/elo'
import { getDb } from '../utils/firebaseAdmin'
import { requireUser } from '../utils/auth'
import fallbackQuestions from '../../data/questions.json'

export default defineEventHandler(async (event) => {
  const topicId = String(getQuery(event).topicId ?? '')
  if (!topicId) {
    throw createError({ statusCode: 400, statusMessage: 'bad_request' })
  }

  // Hỗ trợ cả đăng nhập thật và demo/khách
  let uid = 'demo_student_1'
  try {
    const user = await requireUser(event)
    uid = user.uid
  } catch {
    // Guest or demo
  }

  let r = DEFAULT_USER_RATING

  try {
    const db = getDb()

    // 1) Lấy rating của user ở chuyên đề này
    try {
      const rSnap = await db.doc(`users/${uid}/ratings/${topicId}`).get()
      if (rSnap.exists) {
        r = (rSnap.data()?.rating as number) ?? DEFAULT_USER_RATING
      }
    } catch {}

    // 2) Truy vấn các câu hỏi theo topicId (Chỉ dùng single equality để KHÔNG CẦN COMPOSITE INDEX)
    const [qSnap, solved] = await Promise.all([
      db.collection('questions').where('topicId', '==', topicId).get(),
      db.collection(`users/${uid}/solved`).where('topicId', '==', topicId).get().catch(() => ({ docs: [] })),
    ])

    const done = new Set(solved.docs.map((d: any) => d.id))
    const available = qSnap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }))
      .filter((q: any) => (q.status === 'published' || !q.status) && !done.has(q.id))

    if (available.length > 0) {
      // Sắp xếp các câu hỏi có độ khó (rating) gần nhất với Elo của user
      available.sort((a: any, b: any) => {
        const diffA = Math.abs((a.rating ?? 1000) - r)
        const diffB = Math.abs((b.rating ?? 1000) - r)
        return diffA - diffB
      })
      return { userRating: r, questions: available.slice(0, 10) }
    }
  } catch (err: any) {
    console.warn('Firestore recommend query error, using local fallback:', err.message)
  }

  // Fallback từ questions.json nếu chưa có câu hỏi hoặc lỗi
  const fallback = (fallbackQuestions as any[])
    .filter((q: any) => q.topicId === topicId)
    .map(({ accepted, explanation, ...pub }: any) => ({
      ...pub,
      rating: DIFFICULTY_BASE[pub.level] ?? 1000,
    }))

  return {
    userRating: r,
    questions: fallback.slice(0, 10),
  }
})
