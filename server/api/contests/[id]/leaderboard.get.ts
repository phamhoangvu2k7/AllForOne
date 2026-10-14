import { getDb } from '../../../utils/firebaseAdmin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const snap = await db
    .collection(`contests/${id}/participants`)
    .orderBy('score', 'desc')
    .limit(50)
    .get()

  return snap.docs.map((d: any, index: number) => {
    const data = d.data()!
    return {
      rank: index + 1,
      id: d.id,
      displayName: data.displayName || 'Thí sinh',
      school: data.school || 'THPT',
      score: data.score || 0,
      solved: data.solved || 0,
      lastCorrectAt: data.lastCorrectAt,
    }
  })
})

