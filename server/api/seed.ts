import topicsData from '../../data/topics.json'
import questionsData from '../../data/questions.json'
import contestsData from '../../data/contests.json'
import { DIFFICULTY_BASE } from '../utils/elo'
import { getDb, dbTimestamp } from '../utils/firebaseAdmin'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const body = event.method === 'POST' ? await readBody(event).catch(() => ({})) : {}
  const secret = query.secret || body?.secret

  // Khóa bảo vệ tránh người lạ gọi bừa bãi
  if (secret !== 'allforone' && secret !== 'seed') {
    return {
      message: 'Vui lòng cung cấp secret key để seed data, ví dụ: /api/seed?secret=allforone',
      hint: 'Bạn có thể gọi GET hoặc POST tới endpoint này kèm ?secret=allforone',
    }
  }

  const db = getDb()

  try {
    // 1) Seed Topics
    const topicBatch = db.batch()
    for (const t of topicsData as any[]) {
      topicBatch.set(db.doc(`topics/${t.id}`), t, { merge: true })
    }
    await topicBatch.commit()

    // 2) Seed Contests
    const contestBatch = db.batch()
    for (const c of contestsData as any[]) {
      contestBatch.set(
        db.doc(`contests/${c.id}`),
        {
          ...c,
          startTime: new Date(c.startTime),
          endTime: new Date(c.endTime),
        },
        { merge: true },
      )
    }
    await contestBatch.commit()

    // 3) Seed Questions & QuestionKeys (Batch theo lô 200)
    let qBatch = db.batch()
    let count = 0

    for (const q of questionsData as any[]) {
      const { accepted, explanation, id, ...pub } = q

      qBatch.set(
        db.doc(`questions/${id}`),
        {
          ...pub,
          rating: DIFFICULTY_BASE[q.level] ?? 1000,
          attempts: 0,
          correctCount: 0,
          status: 'published',
          authorId: 'seed',
          createdAt: dbTimestamp(),
        },
        { merge: true },
      )

      qBatch.set(
        db.doc(`questionKeys/${id}`),
        { accepted, explanation },
        { merge: true },
      )

      count++
      if (count % 200 === 0) {
        await qBatch.commit()
        qBatch = db.batch()
      }
    }
    await qBatch.commit()

    return {
      success: true,
      message: 'Nạp dữ liệu (seed) thành công vào Firestore!',
      details: {
        topicsSeeded: (topicsData as any[]).length,
        contestsSeeded: (contestsData as any[]).length,
        questionsSeeded: count,
      },
    }
  } catch (err: any) {
    console.error('Seed API error:', err)
    const isNotFound = err.code === 5 || String(err.message).includes('NOT_FOUND')
    return {
      success: false,
      error: err.message || 'Lỗi khi nạp dữ liệu vào Firestore.',
      code: err.code,
      reason: isNotFound ? 'FIRESTORE_DATABASE_NOT_CREATED' : 'UNKNOWN_ERROR',
      hint: isNotFound
        ? 'Cực kỳ quan trọng: Bạn chưa bấm "Create database" trên Firebase Console! Vào Firebase Console -> Build -> Firestore Database -> bấm nút [Create database] để khởi tạo database trước.'
        : 'Vui lòng kiểm tra lại cấu hình Firebase Admin Key trên Vercel Environment Variables.',
    }
  }
})

