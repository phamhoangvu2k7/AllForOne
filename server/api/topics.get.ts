import { DEFAULT_USER_RATING } from '../utils/elo'
import { getDb } from '../utils/firebaseAdmin'
import { requireUser } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const subject = String(getQuery(event).subject || '')

  // Optional user authentication for topic rating personalizations
  let uid: string | null = null
  try {
    const user = await requireUser(event)
    uid = user.uid
  } catch {
    // Guest or unauthenticated request
  }

  const topicSnap = await db.collection('topics').get()
  const qSnap = await db.collection('questions').where('status', '==', 'published').get()

  // Count questions per topic
  const counts: Record<string, number> = {}
  for (const doc of qSnap.docs) {
    const tid = doc.data()?.topicId
    if (tid) {
      counts[tid] = (counts[tid] || 0) + 1
    }
  }

  // Fetch user ratings if user is logged in
  const userRatings: Record<string, number> = {}
  if (uid) {
    for (const tDoc of topicSnap.docs) {
      const rSnap = await db.doc(`users/${uid}/ratings/${tDoc.id}`).get()
      if (rSnap.exists) {
        userRatings[tDoc.id] = rSnap.data()?.rating ?? DEFAULT_USER_RATING
      } else {
        userRatings[tDoc.id] = DEFAULT_USER_RATING
      }
    }
  }

  const topics = topicSnap.docs
    .map((d: any) => ({
      id: d.id,
      ...d.data(),
      questionCount: counts[d.id] || 0,
      userRating: userRatings[d.id] ?? DEFAULT_USER_RATING,
    }))
    .filter((t: any) => !subject || t.subject === subject)
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))

  return topics
})

