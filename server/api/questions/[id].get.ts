import { getDb } from '../../utils/firebaseAdmin'
import fallbackQuestions from '../../../data/questions.json'
import { DIFFICULTY_BASE } from '../../utils/elo'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  try {
    const db = getDb()
    const snap = await db.doc(`questions/${id}`).get()
    if (snap.exists) {
      const data = snap.data()!
      const { accepted, explanation, ...pub } = data
      return {
        id: snap.id,
        ...pub,
      }
    }
  } catch (err) {
    console.warn('Firestore fetch question error, trying fallback:', err)
  }

  // Fallback to local questions
  const q = (fallbackQuestions as any[]).find((it: any) => it.id === id)
  if (q) {
    const { accepted, explanation, ...pub } = q
    return {
      ...pub,
      rating: DIFFICULTY_BASE[q.level] ?? 1000,
    }
  }

  throw createError({ statusCode: 404, statusMessage: 'question_not_found' })
})

