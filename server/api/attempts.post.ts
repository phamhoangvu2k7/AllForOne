import { GUESS_FLOOR_MCQ, DEFAULT_USER_RATING, updateRatings } from '../utils/elo'
import { checkAnswer } from '../utils/answer'
import { vnDate, vnYesterday } from '../utils/date'
import { getDb, dbIncrement, dbTimestamp, dbNowTimestamp } from '../utils/firebaseAdmin'
import { requireUser } from '../utils/auth'

const CONTEST_POINTS: Record<number, number> = { 1: 100, 2: 150, 3: 200, 4: 300 }
const GRACE_MS = 5000 // du di mang

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{
    questionId?: string
    answer?: string
    contestId?: string | null
    timeMs?: number
  }>(event)

  const { questionId, answer, contestId = null } = body ?? {}
  const timeMs = Math.max(0, Math.min(Number(body?.timeMs) || 0, 3_600_000))
  if (!questionId || typeof answer !== 'string' || answer.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'bad_request' })
  }

  const db = getDb()
  const uid = user.uid

  return await db.runTransaction(async (tx: any) => {
    // ---------- 1) DOC TRUOC ----------
    const qRef = db.doc(`questions/${questionId}`)
    const kRef = db.doc(`questionKeys/${questionId}`)
    const uRef = db.doc(`users/${uid}`)
    const solvedRef = db.doc(`users/${uid}/solved/${questionId}`)

    const [qSnap, kSnap, uSnap, solvedSnap] = await Promise.all([
      tx.get(qRef),
      tx.get(kRef),
      tx.get(uRef),
      tx.get(solvedRef),
    ])

    if (!qSnap.exists || !kSnap.exists) {
      throw createError({ statusCode: 404, statusMessage: 'question_not_found' })
    }
    const q = qSnap.data()!
    const key = kSnap.data()!

    const topicRef = db.doc(`users/${uid}/ratings/${q.topicId}`)
    const subjectRef = db.doc(`users/${uid}/ratings/subject_${q.subject}`)
    const [topicSnap, subjectSnap] = await Promise.all([tx.get(topicRef), tx.get(subjectRef)])

    // contest (neu co)
    let partRef: any
    let attemptRef: any = db.collection('attempts').doc()
    if (contestId) {
      const cRef = db.doc(`contests/${contestId}`)
      partRef = db.doc(`contests/${contestId}/participants/${uid}`)
      attemptRef = db.doc(`attempts/${contestId}_${uid}_${questionId}`)

      const [cSnap, pSnap, aSnap] = await Promise.all([tx.get(cRef), tx.get(partRef), tx.get(attemptRef)])
      if (!cSnap.exists || !pSnap.exists) {
        throw createError({ statusCode: 403, statusMessage: 'not_in_contest' })
      }
      if (aSnap.exists) {
        throw createError({ statusCode: 409, statusMessage: 'already_submitted' })
      }

      const contest = cSnap.data()!
      if (!contest.questionIds.includes(questionId)) {
        throw createError({ statusCode: 400, statusMessage: 'question_not_in_contest' })
      }

      const pData = pSnap.data()!
      const startMs =
        typeof pData.startedAt?.toMillis === 'function'
          ? pData.startedAt.toMillis()
          : pData.startedAt instanceof Date
          ? pData.startedAt.getTime()
          : typeof pData.startedAt === 'number'
          ? pData.startedAt
          : new Date(pData.startedAt).getTime()

      const endMs =
        typeof contest.endTime?.toMillis === 'function'
          ? contest.endTime.toMillis()
          : contest.endTime instanceof Date
          ? contest.endTime.getTime()
          : typeof contest.endTime === 'number'
          ? contest.endTime
          : new Date(contest.endTime).getTime()

      const deadline = Math.min(endMs, startMs + contest.durationMin * 60_000) + GRACE_MS

      if (Date.now() > deadline) {
        throw createError({ statusCode: 403, statusMessage: 'contest_over' })
      }
    }

    // ---------- 2) TINH TOAN ELO ----------
    const correct = checkAnswer(q.type, answer, key.accepted)
    const guess = q.type === 'mcq' ? GUESS_FLOOR_MCQ : 0
    const firstTime = !solvedSnap.exists
    const inContest = Boolean(contestId)

    const topicR = topicSnap.data() ?? { rating: DEFAULT_USER_RATING, attempts: 0, correct: 0 }
    const subjectR = subjectSnap.data() ?? { rating: DEFAULT_USER_RATING, attempts: 0, correct: 0 }

    let ratingAfter = topicR.rating as number
    let newQuestionRating = q.rating as number
    let newSubjectRating = subjectR.rating as number

    if (firstTime) {
      const t = updateRatings({
        userRating: topicR.rating,
        questionRating: q.rating,
        correct,
        userAttempts: topicR.attempts,
        questionAttempts: q.attempts,
        guess,
        inContest,
      })
      const s = updateRatings({
        userRating: subjectR.rating,
        questionRating: q.rating,
        correct,
        userAttempts: subjectR.attempts,
        questionAttempts: q.attempts,
        guess,
        inContest,
      })
      ratingAfter = t.newUserRating
      newQuestionRating = t.newQuestionRating
      newSubjectRating = s.newUserRating
    }

    // Streak logic
    const today = vnDate()
    const last = uSnap.data()?.lastActiveDate as string | undefined
    const prevStreak = (uSnap.data()?.streak as number | undefined) ?? 0
    const streak = last === today ? prevStreak : last === vnYesterday() ? prevStreak + 1 : 1

    // ---------- 3) GHI DU LIEU ----------
    tx.set(attemptRef, {
      uid,
      questionId,
      topicId: q.topicId,
      subject: q.subject,
      answer,
      correct,
      timeMs,
      contestId,
      ratingBefore: topicR.rating,
      ratingAfter,
      countedForRating: firstTime,
      createdAt: dbTimestamp(),
    })

    if (firstTime) {
      tx.set(
        topicRef,
        {
          rating: ratingAfter,
          attempts: dbIncrement(1),
          correct: dbIncrement(correct ? 1 : 0),
          updatedAt: dbTimestamp(),
        },
        { merge: true },
      )

      tx.set(
        subjectRef,
        {
          rating: newSubjectRating,
          attempts: dbIncrement(1),
          correct: dbIncrement(correct ? 1 : 0),
          updatedAt: dbTimestamp(),
        },
        { merge: true },
      )

      tx.update(qRef, {
        rating: newQuestionRating,
        attempts: dbIncrement(1),
        correctCount: dbIncrement(correct ? 1 : 0),
      })

      tx.set(solvedRef, { topicId: q.topicId, correct, at: dbTimestamp() })

      tx.set(
        db.doc(`leaderboards/${q.subject}/entries/${uid}`),
        {
          displayName: uSnap.data()?.displayName ?? user.name ?? 'Học sinh',
          school: uSnap.data()?.school ?? '',
          province: uSnap.data()?.province ?? '',
          rating: newSubjectRating,
          updatedAt: dbTimestamp(),
        },
        { merge: true },
      )
    }

    tx.set(uRef, { streak, lastActiveDate: today }, { merge: true })
    tx.set(db.doc(`users/${uid}/activity/${today}`), { count: dbIncrement(1) }, { merge: true })

    if (contestId && partRef) {
      const gained = correct ? CONTEST_POINTS[q.level] ?? 100 : 0
      const upd: Record<string, unknown> = { score: dbIncrement(gained) }
      if (correct) {
        upd.solved = dbIncrement(1)
        upd.lastCorrectAt = dbNowTimestamp()
      }
      tx.update(partRef, upd)
    }

    return {
      correct,
      firstTime,
      ratingBefore: topicR.rating as number,
      ratingAfter,
      // Trong contest: chua lo loi giai va dap an, chi lo sau khi contest ket thuc
      explanation: inContest ? null : (key.explanation as string),
      correctAnswer: inContest ? null : (key.accepted as string[]),
    }
  })
})

