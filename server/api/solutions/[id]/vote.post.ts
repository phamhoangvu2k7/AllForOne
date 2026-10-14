import { getDb, dbIncrement, dbTimestamp } from '../../../utils/firebaseAdmin'
import { requireUser } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  const db = getDb()
  const sRef = db.doc(`solutions/${id}`)
  const vRef = db.doc(`solutions/${id}/votes/${user.uid}`)

  const voted = await db.runTransaction(async (tx: any) => {
    const [s, v] = await Promise.all([tx.get(sRef), tx.get(vRef)])
    if (!s.exists) {
      throw createError({ statusCode: 404, statusMessage: 'not_found' })
    }
    if (s.data()!.authorId === user.uid) {
      throw createError({ statusCode: 400, statusMessage: 'self_vote' })
    }

    if (v.exists) {
      tx.delete(vRef)
      tx.update(sRef, { votes: dbIncrement(-1) })
      return false
    }

    tx.set(vRef, { at: dbTimestamp() })
    tx.update(sRef, { votes: dbIncrement(1) })
    return true
  })

  return { voted }
})

