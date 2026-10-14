import { getDb } from '../../utils/firebaseAdmin'
import fallbackContests from '../../../data/contests.json'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'public, s-maxage=60, stale-while-revalidate=300')
  const db = getDb()
  const snap = await db.collection('contests').get()
  const now = Date.now()

  const contests = snap.docs.map((d: any) => {
    const data = d.data()!
    const startMs =
      typeof data.startTime?.toMillis === 'function'
        ? data.startTime.toMillis()
        : new Date(data.startTime).getTime()
    const endMs =
      typeof data.endTime?.toMillis === 'function'
        ? data.endTime.toMillis()
        : new Date(data.endTime).getTime()

    let status = 'scheduled'
    if (now >= startMs && now <= endMs) {
      status = 'running'
    } else if (now > endMs) {
      status = 'finished'
    }

    return {
      id: d.id,
      title: data.title,
      subject: data.subject,
      description: data.description || '',
      durationMin: data.durationMin,
      startTime: startMs,
      endTime: endMs,
      questionCount: data.questionIds?.length || 0,
      status,
    }
  })

  // Sắp xếp: đang diễn ra -> sắp diễn ra -> đã kết thúc
  contests.sort((a: any, b: any) => {
    const priority = (s: string) => (s === 'running' ? 0 : s === 'scheduled' ? 1 : 2)
    return priority(a.status) - priority(b.status) || a.startTime - b.startTime
  })

  return contests
})

