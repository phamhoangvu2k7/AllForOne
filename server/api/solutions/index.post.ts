import { getDb, dbTimestamp } from '../../utils/firebaseAdmin'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { questionId, content } =
    (await readBody<{ questionId?: string; content?: string }>(event)) ?? {}

  if (!questionId || !content || content.length < 10 || content.length > 4000) {
    throw createError({ statusCode: 400, statusMessage: 'bad_request' })
  }

  const db = getDb()
  const solved = await db.doc(`users/${user.uid}/solved/${questionId}`).get()
  // Chỉ cho người đã làm câu hỏi đăng lời giải để tránh spam
  if (!solved.exists) {
    throw createError({ statusCode: 403, statusMessage: 'not_attempted' })
  }

  const u = (await db.doc(`users/${user.uid}`).get()).data()
  const ref = await db.collection('solutions').add({
    questionId,
    content,
    authorId: user.uid,
    authorName: u?.displayName ?? user.name ?? 'Học sinh',
    votes: 0,
    pinned: false,
    createdAt: dbTimestamp(),
  })

  return { id: ref.id }
})

