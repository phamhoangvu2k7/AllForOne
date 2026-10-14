import { DEFAULT_USER_RATING } from '../utils/elo'
import { vnDate } from '../utils/date'
import { getDb } from '../utils/firebaseAdmin'
import { requireUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = getDb()
  const uid = user.uid

  // 1) User document
  const uSnap = await db.doc(`users/${uid}`).get()
  const uData = uSnap.exists ? uSnap.data()! : {}

  // 2) Topics & Ratings
  const topicSnap = await db.collection('topics').get()
  const topicRatings: Array<{
    id: string
    name: string
    subject: string
    rating: number
    attempts: number
    correct: number
  }> = []

  for (const tDoc of topicSnap.docs) {
    const tData = tDoc.data()!
    const rSnap = await db.doc(`users/${uid}/ratings/${tDoc.id}`).get()
    const rData = rSnap.exists ? rSnap.data()! : { rating: DEFAULT_USER_RATING, attempts: 0, correct: 0 }
    topicRatings.push({
      id: tDoc.id,
      name: tData.name,
      subject: tData.subject,
      rating: rData.rating ?? DEFAULT_USER_RATING,
      attempts: rData.attempts ?? 0,
      correct: rData.correct ?? 0,
    })
  }

  // 3) Subject ratings
  const toanSubjectSnap = await db.doc(`users/${uid}/ratings/subject_toan`).get()
  const lySubjectSnap = await db.doc(`users/${uid}/ratings/subject_ly`).get()

  // 4) Activity heatmap (last 12 weeks = 84 days)
  const activity: Record<string, number> = {}
  const now = new Date()
  for (let i = 0; i < 84; i++) {
    const d = new Date(now.getTime() - i * 86400000)
    const dateStr = vnDate(d)
    const actSnap = await db.doc(`users/${uid}/activity/${dateStr}`).get()
    if (actSnap.exists) {
      activity[dateStr] = actSnap.data()?.count || 0
    }
  }

  // 5) Total attempts and solved count
  const attemptsSnap = await db
    .collection('attempts')
    .where('uid', '==', uid)
    .get()
  const totalAttempts = attemptsSnap.docs.length
  const totalCorrect = attemptsSnap.docs.filter((d: any) => d.data()?.correct).length

  return {
    uid,
    displayName: uData.displayName || user.name || 'Học sinh',
    school: uData.school || 'THPT',
    province: uData.province || 'Toàn quốc',
    grade: uData.grade || 12,
    role: uData.role || 'student',
    streak: uData.streak || 0,
    lastActiveDate: uData.lastActiveDate || vnDate(),
    ratings: {
      toan: toanSubjectSnap.exists ? toanSubjectSnap.data()?.rating ?? DEFAULT_USER_RATING : DEFAULT_USER_RATING,
      ly: lySubjectSnap.exists ? lySubjectSnap.data()?.rating ?? DEFAULT_USER_RATING : DEFAULT_USER_RATING,
    },
    topicRatings,
    activity,
    stats: {
      totalAttempts,
      totalCorrect,
      accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    },
  }
})

