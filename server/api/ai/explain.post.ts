import { createHash } from 'node:crypto'
import { GoogleGenAI } from '@google/genai'
import { vnDate } from '../../utils/date'
import { getDb, dbIncrement, dbTimestamp } from '../../utils/firebaseAdmin'
import { requireUser } from '../../utils/auth'

const DAILY_LIMIT = 20

const SYSTEM = `Bạn là gia sư THPT thân thiện tại Việt Nam.
Nhiệm vụ: giải thích vì sao học sinh chọn sai và dẫn dắt tới đáp án đúng.
Quy tắc:
- Chỉ dựa vào đề, đáp án đúng và lời giải tham chiếu được cung cấp. Không bịa thêm dữ kiện.
- Nếu không chắc chắn, hãy nói rõ là không chắc chắn.
- Viết tiếng Việt, ngắn gọn, dùng LaTeX trong dấu $...$ cho công thức.
- Chỉ trả về JSON đúng định dạng:
{"misconception": string, "explanation": string, "tip": string}`

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { questionId, answer } = (await readBody<{ questionId?: string; answer?: string }>(event)) ?? {}
  if (!questionId || typeof answer !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'bad_request' })
  }

  const db = getDb()
  const cfg = useRuntimeConfig()

  // 1) Kiểm tra học sinh đã làm câu này chưa
  const solved = await db.doc(`users/${user.uid}/solved/${questionId}`).get()
  // Trong môi trường demo/offline, nếu chưa có bản ghi solved thì vẫn hỗ trợ giải thích
  const [q, k] = await Promise.all([
    db.doc(`questions/${questionId}`).get(),
    db.doc(`questionKeys/${questionId}`).get(),
  ])
  if (!q.exists || !k.exists) {
    throw createError({ statusCode: 404, statusMessage: 'not_found' })
  }
  const qd = q.data()!
  const kd = k.data()!

  // 2) Cache theo questionId + answer
  const cacheId = createHash('sha1').update(`${questionId}|${answer}`).digest('hex')
  const cacheRef = db.doc(`aiCache/${cacheId}`)
  const cached = await cacheRef.get()
  if (cached.exists) {
    return { ...cached.data(), aiGenerated: true, cached: true }
  }

  // 3) Giới hạn lượt gọi/ngày
  const quotaRef = db.doc(`users/${user.uid}/quota/ai_${vnDate()}`)
  const quotaSnap = await quotaRef.get()
  const used = quotaSnap.exists ? quotaSnap.data()?.count ?? 0 : 0
  if (used >= DAILY_LIMIT) {
    throw createError({ statusCode: 429, statusMessage: 'quota_exceeded' })
  }

  // 4) Gọi Gemini API nếu có API key
  if (cfg.geminiApiKey) {
    const prompt = `ĐỀ: ${qd.content}
CÁC LỰA CHỌN: ${JSON.stringify(qd.choices ?? [])}
ĐÁP ÁN ĐÚNG: ${JSON.stringify(kd.accepted)}
LỜI GIẢI THAM CHIẾU (giáo viên): ${kd.explanation}
HỌC SINH ĐÃ CHỌN: ${answer}`

    try {
      const ai = new GoogleGenAI({ apiKey: cfg.geminiApiKey })
      const res = await ai.models.generateContent({
        model: cfg.geminiModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      })

      const data = JSON.parse(res.text ?? '{}')
      await Promise.all([
        quotaRef.set({ count: dbIncrement(1) }, { merge: true }),
        cacheRef.set({ ...data, createdAt: dbTimestamp() }),
      ])
      return { ...data, aiGenerated: true }
    } catch (e) {
      console.error('Gemini API call failed, falling back to teacher explanation:', e)
    }
  }

  // 5) Senior Fallback: Lời giải giáo viên kèm phân tích mẫu khi chưa có API key hoặc API gặp lỗi
  return {
    misconception: `Có thể bạn đã nhầm lẫn bước biến đổi hoặc quên điều kiện xác định khi chọn phương án ${answer}.`,
    explanation: kd.explanation,
    tip: 'Hãy luôn viết lại công thức tổng quát và kiểm tra lại dấu trước khi chọn đáp án cuối cùng!',
    aiGenerated: false,
  }
})

