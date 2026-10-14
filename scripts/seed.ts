import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { DIFFICULTY_BASE } from '../server/utils/elo'

async function main() {
  const projectId = process.env.NUXT_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.NUXT_FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.NUXT_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('Connecting to Firestore Emulator at', process.env.FIRESTORE_EMULATOR_HOST)
    if (!getApps().length) initializeApp({ projectId: projectId || 'demo-allforone' })
  } else if (projectId && clientEmail && privateKey) {
    console.log('Connecting to Firebase Cloud Firestore for project:', projectId)
    if (!getApps().length) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      })
    }
  } else {
    console.log('No Firebase credentials or emulator host provided. Questions JSON is already configured for local use.')
    return
  }

  const db = getFirestore()
  const qFile = path.resolve('data/questions.json')
  const tFile = path.resolve('data/topics.json')
  const cFile = path.resolve('data/contests.json')

  // 1) Seed topics
  if (fs.existsSync(tFile)) {
    const topics = JSON.parse(fs.readFileSync(tFile, 'utf8'))
    let b = db.batch()
    for (const t of topics) {
      b.set(db.doc(`topics/${t.id}`), t)
    }
    await b.commit()
    console.log(`Seeded ${topics.length} topics.`)
  }

  // 2) Seed contests
  if (fs.existsSync(cFile)) {
    const contests = JSON.parse(fs.readFileSync(cFile, 'utf8'))
    let b = db.batch()
    for (const c of contests) {
      b.set(db.doc(`contests/${c.id}`), {
        ...c,
        startTime: new Date(c.startTime),
        endTime: new Date(c.endTime),
      })
    }
    await b.commit()
    console.log(`Seeded ${contests.length} contests.`)
  }

  // 3) Seed questions and keys
  if (fs.existsSync(qFile)) {
    const items = JSON.parse(fs.readFileSync(qFile, 'utf8'))
    let batch = db.batch()
    let n = 0

    for (const it of items) {
      const { accepted, explanation, id, ...pub } = it
      batch.set(db.doc(`questions/${id}`), {
        ...pub,
        rating: DIFFICULTY_BASE[it.level] ?? 1000,
        attempts: 0,
        correctCount: 0,
        status: 'published',
        authorId: 'seed',
        createdAt: FieldValue.serverTimestamp(),
      })
      batch.set(db.doc(`questionKeys/${id}`), { accepted, explanation })

      n++
      if (n % 200 === 0) {
        await batch.commit()
        batch = db.batch()
      }
    }
    await batch.commit()
    console.log(`Seeded ${n} questions and question keys.`)
  }
}

main().catch(console.error)

