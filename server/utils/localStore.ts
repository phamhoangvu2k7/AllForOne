import topicsData from '../../data/topics.json'
import questionsData from '../../data/questions.json'
import contestsData from '../../data/contests.json'
import { DIFFICULTY_BASE } from './elo'
import { vnYesterday } from './date'

// In-memory document storage for instant offline development and zero-config demo
const store = new Map<string, Record<string, any>>()

// Initialize from data/*.json
function initStore() {
  if (store.size > 0) return

  try {
    for (const t of topicsData as any[]) {
      store.set(`topics/${t.id}`, { ...t })
    }

    for (const q of questionsData as any[]) {
      const { accepted, explanation, ...pub } = q
      store.set(`questions/${q.id}`, {
        ...pub,
        rating: DIFFICULTY_BASE[q.level] ?? 1000,
        attempts: 0,
        correctCount: 0,
        status: 'published',
        authorId: 'seed',
        createdAt: new Date(),
      })
      store.set(`questionKeys/${q.id}`, { accepted, explanation })
    }

    for (const c of contestsData as any[]) {
      store.set(`contests/${c.id}`, {
        ...c,
        startTime: { toMillis: () => new Date(c.startTime).getTime(), toDate: () => new Date(c.startTime) },
        endTime: { toMillis: () => new Date(c.endTime).getTime(), toDate: () => new Date(c.endTime) },
      })

        // Seed some sample bot participants for leaderboard demo
        const bots = [
          { uid: 'bot_1', displayName: 'Trần Minh Quân', school: 'THPT Chuyên Lê Quý Đôn', score: 350, solved: 2 },
          { uid: 'bot_2', displayName: 'Lê Thảo Vy', school: 'THPT Chu Văn An', score: 250, solved: 1 },
          { uid: 'bot_3', displayName: 'Phạm Đức Anh', school: 'THPT Chuyên Hà Nội - Amsterdam', score: 150, solved: 1 },
        ]
        for (const b of bots) {
          store.set(`contests/${c.id}/participants/${b.uid}`, {
            ...b,
            startedAt: { toMillis: () => Date.now() - 600000 },
            lastCorrectAt: new Date(),
          })
        }
      }

    // Default mock user profile
    store.set('users/demo_student_1', {
      displayName: 'Nguyễn Văn A',
      school: 'THPT Chuyên Quốc Học Huế',
      province: 'Thừa Thiên Huế',
      grade: 12,
      role: 'student',
      streak: 5,
      lastActiveDate: vnYesterday(),
      createdAt: new Date(),
    })
    store.set('users/demo_student_1/ratings/toan12_dao-ham-cuc-tri', {
      rating: 1040,
      attempts: 3,
      correct: 2,
      updatedAt: new Date(),
    })
    store.set('users/demo_student_1/ratings/subject_toan', {
      rating: 1040,
      attempts: 3,
      correct: 2,
      updatedAt: new Date(),
    })
  } catch (err) {
    console.warn('LocalStore init warning:', err)
  }
}

class MockDocSnap {
  constructor(public id: string, private dataObj: Record<string, any> | undefined) {}
  get exists(): boolean {
    return this.dataObj !== undefined
  }
  data(): Record<string, any> | undefined {
    return this.dataObj ? { ...this.dataObj } : undefined
  }
}

class MockDocRef {
  constructor(public path: string) {}
  get id(): string {
    const parts = this.path.split('/')
    return parts[parts.length - 1]!
  }

  async get(): Promise<MockDocSnap> {
    initStore()
    const raw = store.get(this.path)
    return new MockDocSnap(this.id, raw)
  }

  async set(data: Record<string, any>, options?: { merge?: boolean }): Promise<void> {
    initStore()
    const existing = store.get(this.path) || {}
    let merged = { ...data }
    if (options?.merge) {
      merged = { ...existing, ...data }
    }
    // Handle increments and timestamps
    for (const [k, v] of Object.entries(merged)) {
      if (v && typeof v === 'object' && v.__op === 'increment') {
        const cur = Number(existing[k]) || 0
        merged[k] = cur + v.amount
      } else if (v && typeof v === 'object' && v.__op === 'timestamp') {
        merged[k] = new Date()
      }
    }
    store.set(this.path, merged)
  }

  async update(data: Record<string, any>): Promise<void> {
    return this.set(data, { merge: true })
  }

  async delete(): Promise<void> {
    initStore()
    store.delete(this.path)
  }
}

class MockCollectionRef {
  private wheres: Array<{ field: string; op: string; val: any }> = []
  private order: { field: string; dir: 'asc' | 'desc' } | null = null
  private lim: number | null = null

  constructor(public path: string) {}

  doc(id?: string): MockDocRef {
    const docId = id || Math.random().toString(36).substring(2, 10)
    return new MockDocRef(`${this.path}/${docId}`)
  }

  where(field: string, op: string, val: any): MockCollectionRef {
    const q = new MockCollectionRef(this.path)
    q.wheres = [...this.wheres, { field, op, val }]
    q.order = this.order
    q.lim = this.lim
    return q
  }

  orderBy(field: string, dir: 'asc' | 'desc' = 'asc'): MockCollectionRef {
    const q = new MockCollectionRef(this.path)
    q.wheres = [...this.wheres]
    q.order = { field, dir }
    q.lim = this.lim
    return q
  }

  limit(n: number): MockCollectionRef {
    const q = new MockCollectionRef(this.path)
    q.wheres = [...this.wheres]
    q.order = this.order
    q.lim = n
    return q
  }

  async add(data: Record<string, any>): Promise<MockDocRef> {
    const ref = this.doc()
    await ref.set(data)
    return ref
  }

  async get(): Promise<{ docs: MockDocSnap[] }> {
    initStore()
    const prefix = `${this.path}/`
    let entries: Array<{ id: string; data: Record<string, any> }> = []

    for (const [k, v] of store.entries()) {
      if (k.startsWith(prefix)) {
        const sub = k.slice(prefix.length)
        if (!sub.includes('/')) {
          entries.push({ id: sub, data: v })
        }
      }
    }

    // Apply where filters
    for (const w of this.wheres) {
      entries = entries.filter((e) => {
        const val = e.data[w.field]
        if (w.op === '==') return val === w.val
        if (w.op === '>=') return val >= w.val
        if (w.op === '<=') return val <= w.val
        if (w.op === '>') return val > w.val
        if (w.op === '<') return val < w.val
        return true
      })
    }

    // Apply ordering
    if (this.order) {
      const { field, dir } = this.order
      entries.sort((a, b) => {
        const va = a.data[field]
        const vb = b.data[field]
        if (va < vb) return dir === 'asc' ? -1 : 1
        if (va > vb) return dir === 'asc' ? 1 : -1
        return 0
      })
    }

    // Apply limit
    if (this.lim !== null) {
      entries = entries.slice(0, this.lim)
    }

    return {
      docs: entries.map((e) => new MockDocSnap(e.id, e.data)),
    }
  }
}

export class MockFirestore {
  doc(path: string): MockDocRef {
    return new MockDocRef(path)
  }

  collection(path: string): MockCollectionRef {
    return new MockCollectionRef(path)
  }

  async runTransaction<T>(updateFunction: (tx: any) => Promise<T>): Promise<T> {
    initStore()
    const tx = {
      async get(ref: MockDocRef) {
        return ref.get()
      },
      set(ref: MockDocRef, data: Record<string, any>, options?: { merge?: boolean }) {
        return ref.set(data, options)
      },
      update(ref: MockDocRef, data: Record<string, any>) {
        return ref.update(data)
      },
      delete(ref: MockDocRef) {
        return ref.delete()
      },
    }
    return await updateFunction(tx)
  }
}

export const mockDb = new MockFirestore()

