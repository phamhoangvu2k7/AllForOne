# AllForOne — Hướng dẫn build chi tiết bằng Nuxt (Fullstack)

> Nền tảng luyện thi THPT theo **từng câu hỏi**, có **rating năng lực theo chuyên đề**, **contest hằng tuần**, **lời giải cộng đồng** và **AI giải thích lỗi sai**.
>
> Phiên bản này dùng **Nuxt** làm framework fullstack: giao diện Vue 3 + API chạy trên **Nitro** (server engine tích hợp sẵn của Nuxt), dữ liệu trên **Firebase**, AI bằng **Gemini**.
>
> Code mẫu là **điểm khởi đầu**. Hãy chạy thử và chỉnh theo thực tế dự án. Luôn đối chiếu tài liệu chính thức của Nuxt, Firebase và Gemini vì API và tên model có thể thay đổi.

---

## Mục lục
1. [Nguyên tắc thiết kế](#1-nguyên-tắc-thiết-kế)
2. [Stack công nghệ](#2-stack-công-nghệ)
3. [Kiến trúc tổng thể](#3-kiến-trúc-tổng-thể)
4. [Khởi tạo dự án Nuxt](#4-khởi-tạo-dự-án-nuxt)
5. [Thiết kế dữ liệu Firestore](#5-thiết-kế-dữ-liệu-firestore)
6. [Thuật toán rating (Elo)](#6-thuật-toán-rating-elo)
7. [Backend: Nitro server routes](#7-backend-nitro-server-routes)
8. [Contest hằng tuần](#8-contest-hằng-tuần)
9. [Tích hợp AI (Gemini)](#9-tích-hợp-ai-gemini)
10. [Frontend: trang, composable, component](#10-frontend-trang-composable-component)
11. [Bảo mật và chống gian lận](#11-bảo-mật-và-chống-gian-lận)
12. [Nạp dữ liệu (seed)](#12-nạp-dữ-liệu-seed)
13. [Kế hoạch triển khai theo giai đoạn](#13-kế-hoạch-triển-khai-theo-giai-đoạn)
14. [Phân công nhóm](#14-phân-công-nhóm)
15. [Test, deploy, kịch bản demo](#15-test-deploy-kịch-bản-demo)
16. [Rủi ro và lỗi hay gặp (kèm lỗi riêng của Nuxt)](#16-rủi-ro-và-lỗi-hay-gặp)
17. [Backlog sau hackathon](#17-backlog-sau-hackathon)

---

## 1. Nguyên tắc thiết kế

| Nguyên tắc | Ý nghĩa với dự án |
|---|---|
| **Server là nguồn sự thật** | Chấm đáp án, tính rating, tính điểm contest **chỉ làm ở server (Nitro)**. Client không bao giờ nhận đáp án đúng trước khi nộp. |
| **MVP trước, đẹp sau** | Hackathon chấm theo demo chạy được. Ưu tiên luồng: làm câu → rating đổi → contest → bảng xếp hạng. |
| **Một điểm nhấn AI** | Chỉ làm tốt 1 tính năng AI: giải thích lỗi sai. |
| **Dữ liệu minh bạch** | Dữ liệu giả (bot, câu hỏi mẫu) phải ghi rõ khi demo. |
| **Dễ giải thích** | Rating Elo đơn giản để ban giám khảo hiểu trong 30 giây. |

**Phạm vi MVP (P0):**
- Đăng nhập Google.
- 1–2 môn (gợi ý Toán, Lý), 150–300 câu có tag chuyên đề.
- Làm từng câu, chấm tự động, cập nhật rating theo chuyên đề và môn.
- 1 contest chạy thật + bảng xếp hạng realtime.
- AI giải thích lỗi sai.

**Sau đó (P1):** daily challenge + streak + heatmap, lời giải cộng đồng + vote, dashboard giáo viên.
**Cuối (P2):** AI soạn nháp câu hỏi cho giáo viên, giải đấu liên trường.

---

## 2. Stack công nghệ

| Lớp | Công nghệ | Lý do |
|---|---|---|
| Framework | **Nuxt** (Vue 3, TypeScript) | Fullstack một repo: UI + API (`server/`) |
| Server | **Nitro** (có sẵn trong Nuxt) + `firebase-admin` | Route `server/api/*`, chạy logic tin cậy |
| Styling | Tailwind CSS (module cho Nuxt) | Làm UI nhanh |
| Render công thức | `marked` + `marked-katex-extension` + `katex` + `dompurify` | Hiển thị LaTeX và **làm sạch HTML** (chống XSS) |
| Auth | Firebase Authentication (Google Sign-In) | Đăng nhập 1 chạm |
| Database | Cloud Firestore | Realtime cho bảng xếp hạng |
| AI | Gemini API qua SDK `@google/genai` | Giải thích lỗi sai |
| Biểu đồ (P1) | `chart.js` + `vue-chartjs` | Radar rating theo chuyên đề |
| Hosting | Cloud Run (Docker) là lựa chọn Google an toàn nhất; hoặc Vercel/Netlify nếu cần nhanh | Nitro hỗ trợ nhiều preset deploy |
| Test | Vitest, Firebase Emulator Suite | Test thuật toán và rules offline |

> **Về phiên bản Nuxt:** Nuxt 4 dùng thư mục `app/` cho code giao diện (còn `server/` nằm ở gốc). Nuxt 3 để `pages/`, `components/`... ngay ở gốc. Tài liệu này vẽ cấu trúc theo kiểu `app/`; nếu bạn dùng Nuxt 3, bỏ cấp `app/` đi. Giữ nguyên `compatibilityDate` do template tạo ra.
>
> **Về tên model Gemini:** đặt qua biến môi trường, kiểm tra danh sách model hiện có trong Google AI Studio, đừng hard-code.

### Quyết định kiến trúc quan trọng: chạy Nuxt ở chế độ SPA (`ssr: false`)
Đăng nhập Firebase diễn ra ở trình duyệt, trạng thái đăng nhập không có sẵn lúc render phía server. Nếu bật SSR sẽ gặp lỗi hydration và phải xử lý cookie phiên. Ứng dụng này là app sau đăng nhập (không cần SEO cho từng trang làm bài), nên:

- Đặt `ssr: false` cho giao diện.
- **Server routes (`server/api/*`) vẫn chạy bình thường** trên Nitro. Bạn vẫn có một backend thật.

Nếu sau này cần SEO cho trang giới thiệu, dùng `routeRules` để bật SSR/prerender riêng cho trang đó.

---

## 3. Kiến trúc tổng thể

```
┌───────────────┐   ID token     ┌────────────────────────────┐
│ Browser (Vue) │───────────────▶│ Nitro: server/api/*         │
│ Nuxt SPA      │◀───────────────│ (firebase-admin, Gemini)    │
└──────┬────────┘   JSON         └───────┬─────────────┬──────┘
       │                                 │             │
       │ onSnapshot (realtime)           │             │ generateContent
       ▼                                 ▼             ▼
┌───────────────────────────────────────────┐   ┌──────────────┐
│               Cloud Firestore              │   │  Gemini API  │
│ questions • questionKeys (private)         │   └──────────────┘
│ users/{uid}/ratings • attempts • contests  │
│ leaderboards • solutions                   │
└───────────────────────────────────────────┘
```

**Luồng làm 1 câu hỏi:**
1. Client đọc câu hỏi từ `questions` (không có đáp án).
2. Client gọi `POST /api/attempts` kèm ID token + đáp án.
3. Server dùng transaction: đọc đáp án trong `questionKeys`, chấm, cập nhật rating user + rating câu hỏi, ghi attempt, cập nhật streak và leaderboard.
4. Server trả đúng/sai, lời giải giáo viên, rating mới.
5. Nếu sai, client gọi `POST /api/ai/explain` để lấy giải thích lỗi sai.

---

## 4. Khởi tạo dự án Nuxt

### 4.1. Yêu cầu
- Node.js LTS, npm.
- Project Firebase (bật Authentication + Firestore).
- API key Gemini từ Google AI Studio.

### 4.2. Lệnh khởi tạo

```bash
npm create nuxt@latest AllForOne
cd AllForOne

# Tailwind (làm theo hướng dẫn hiện hành của Tailwind/Nuxt nếu có thay đổi phiên bản)
npx nuxi module add tailwindcss

# Thư viện chính
npm i firebase firebase-admin @google/genai \
      marked marked-katex-extension katex dompurify

# Dev
npm i -D vitest tsx dotenv

# (P1) biểu đồ
npm i chart.js vue-chartjs

# Firebase CLI
npm i -g firebase-tools
firebase login
firebase init firestore emulators   # chọn Firestore + Auth emulator
```

### 4.3. Cấu hình `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  // giữ nguyên compatibilityDate do template sinh ra
  ssr: false,                       // SPA cho giao diện; server/api vẫn chạy trên Nitro
  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    // --- chỉ tồn tại ở server ---
    firebaseProjectId: '',
    firebaseClientEmail: '',
    firebasePrivateKey: '',
    geminiApiKey: '',
    geminiModel: '',
    // --- công khai (gửi xuống client) ---
    public: {
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseAppId: '',
      useEmulator: false,
    },
  },
})
```

### 4.4. Biến môi trường (`.env`)

Nuxt ghi đè `runtimeConfig` bằng biến có tiền tố `NUXT_` (camelCase → SCREAMING_SNAKE_CASE):

```bash
# Server (bí mật, KHÔNG commit)
NUXT_FIREBASE_PROJECT_ID=
NUXT_FIREBASE_CLIENT_EMAIL=
NUXT_FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NUXT_GEMINI_API_KEY=
NUXT_GEMINI_MODEL=              # điền model hiện có trong AI Studio

# Public (lấy từ Firebase console > Project settings > Web app)
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
NUXT_PUBLIC_USE_EMULATOR=false
```

Thêm `.env` và mọi file service account vào `.gitignore`.

### 4.5. Cấu trúc thư mục (Nuxt 4)

```
AllForOne/
├─ app/
│  ├─ pages/
│  │  ├─ index.vue
│  │  ├─ login.vue
│  │  ├─ practice/index.vue              # chọn môn/chuyên đề
│  │  ├─ practice/[id].vue               # làm 1 câu
│  │  ├─ contests/index.vue
│  │  ├─ contests/[id].vue               # phòng thi + leaderboard
│  │  ├─ profile.vue                     # rating, streak, heatmap
│  │  └─ teacher.vue                     # thống kê lớp (P1)
│  ├─ components/
│  │  ├─ AppMarkdown.vue                 # KaTeX + sanitize
│  │  ├─ QuestionCard.vue
│  │  ├─ RatingBadge.vue
│  │  ├─ ContestLeaderboard.vue
│  │  └─ ActivityHeatmap.vue
│  ├─ composables/
│  │  ├─ useAuthUser.ts
│  │  ├─ useApi.ts
│  │  └─ useCountdown.ts
│  ├─ middleware/auth.ts
│  ├─ plugins/firebase.client.ts
│  └─ utils/shuffle.ts
├─ server/
│  ├─ api/
│  │  ├─ attempts.post.ts
│  │  ├─ recommend.get.ts
│  │  ├─ ai/explain.post.ts
│  │  ├─ contests/[id]/join.post.ts
│  │  ├─ solutions/index.post.ts
│  │  └─ solutions/[id]/vote.post.ts
│  └─ utils/                             # tự động import trong server routes
│     ├─ firebaseAdmin.ts
│     ├─ auth.ts
│     ├─ elo.ts
│     ├─ answer.ts
│     └─ date.ts
├─ scripts/seed.ts
├─ data/questions.json
├─ firestore.rules
├─ firestore.indexes.json
└─ nuxt.config.ts
```

> Mọi hàm/hằng `export` trong `server/utils/` được Nuxt **tự động import** vào các file `server/api/*`, nên mẫu code bên dưới không cần `import` chúng. Đây là lý do tên hàm nên đặt rõ ràng, tránh trùng nhau.

### 4.6. Firebase phía client (plugin chỉ chạy trên trình duyệt)

`app/plugins/firebase.client.ts`
```ts
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, onAuthStateChanged, connectAuthEmulator, type User } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  const c = useRuntimeConfig().public

  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: c.firebaseApiKey,
      authDomain: c.firebaseAuthDomain,
      projectId: c.firebaseProjectId,
      appId: c.firebaseAppId,
    })

  const auth = getAuth(app)
  const db = getFirestore(app)

  if (c.useEmulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
  }

  // trạng thái đăng nhập dùng chung toàn app, đăng ký listener đúng 1 lần
  const user = useState<User | null>('auth-user', () => null)
  const ready = useState<boolean>('auth-ready', () => false)
  onAuthStateChanged(auth, (u) => {
    user.value = u
    ready.value = true
  })

  return { provide: { auth, db } }
})
```
Dùng ở bất kỳ đâu: `const { $auth, $db } = useNuxtApp()`.

### 4.7. Composable đăng nhập

`app/composables/useAuthUser.ts`
```ts
import { GoogleAuthProvider, signInWithPopup, signOut, type User } from 'firebase/auth'

export function useAuthUser() {
  const { $auth } = useNuxtApp()
  const user = useState<User | null>('auth-user')
  const ready = useState<boolean>('auth-ready')

  const login = () => signInWithPopup($auth, new GoogleAuthProvider())
  const logout = () => signOut($auth)

  return { user, ready, login, logout }
}
```

### 4.8. Middleware bảo vệ trang

`app/middleware/auth.ts`
```ts
export default defineNuxtRouteMiddleware(async () => {
  const { user, ready } = useAuthUser()

  // đợi Firebase xác định trạng thái đăng nhập lần đầu
  if (!ready.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(ready, (v) => {
        if (v) {
          stop()
          resolve()
        }
      })
    })
  }

  if (!user.value) return navigateTo('/login')
})
```
Dùng trong trang: `definePageMeta({ middleware: 'auth' })`.

### 4.9. Gọi API kèm ID token

`app/composables/useApi.ts`
```ts
export function useApi() {
  const { $auth } = useNuxtApp()

  return async function api<T>(url: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    const token = await $auth.currentUser?.getIdToken()
    return $fetch<T>(url, {
      ...opts,
      headers: { ...(opts.headers as Record<string, string> | undefined), Authorization: `Bearer ${token}` },
    })
  }
}
```
Ví dụ: `const api = useApi(); const res = await api('/api/attempts', { method: 'POST', body: { questionId, answer, timeMs } })`.

### 4.10. Firebase Admin và xác thực phía server

`server/utils/firebaseAdmin.ts`
```ts
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

function getAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const c = useRuntimeConfig()

  // Khi chạy Emulator: không cần credential thật
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: c.public.firebaseProjectId })
  }

  return initializeApp({
    credential: cert({
      projectId: c.firebaseProjectId,
      clientEmail: c.firebaseClientEmail,
      privateKey: c.firebasePrivateKey.replace(/\\n/g, '\n'),
    }),
  })
}

export const getDb = () => getFirestore(getAdminApp())
export const getAdminAuth = () => getAuth(getAdminApp())
```

`server/utils/auth.ts`
```ts
import type { H3Event } from 'h3'

export async function requireUser(event: H3Event) {
  const header = getHeader(event, 'authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) throw createError({ statusCode: 401, statusMessage: 'unauthorized' })

  try {
    const d = await getAdminAuth().verifyIdToken(token)
    return { uid: d.uid, name: d.name as string | undefined }
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }
}
```

---

## 5. Thiết kế dữ liệu Firestore

### 5.1. Sơ đồ collection

```
topics/{topicId}
questions/{questionId}                 # đọc được khi đã đăng nhập, KHÔNG chứa đáp án
questionKeys/{questionId}              # riêng tư, chỉ server đọc
users/{uid}
  ├─ ratings/{ratingId}                # ratingId = topicId hoặc "subject_<subjectId>"
  ├─ solved/{questionId}               # đã làm lần đầu (chống farm rating)
  ├─ activity/{yyyy-mm-dd}             # heatmap
  └─ quota/{key}                       # giới hạn lượt gọi AI
attempts/{attemptId}
leaderboards/{subjectId}/entries/{uid} # bảng xếp hạng toàn hệ thống (denormalized)
contests/{contestId}
  └─ participants/{uid}
solutions/{solutionId}
  └─ votes/{uid}
daily/{yyyy-mm-dd}                     # câu hỏi của ngày
aiCache/{hash}                         # cache giải thích AI
```

### 5.2. Schema chi tiết

**`topics/{topicId}`**
```json
{ "subject": "toan", "name": "Đạo hàm – Ứng dụng – Cực trị", "grade": 12, "order": 3 }
```

**`questions/{questionId}`**
```json
{
  "subject": "toan",
  "topicId": "toan12_dao-ham-cuc-tri",
  "level": 2,
  "type": "mcq",
  "content": "Cho hàm số $y = x^3 - 3x + 1$. Giá trị cực đại của hàm số là:",
  "choices": [
    { "id": "A", "text": "$-1$" },
    { "id": "B", "text": "$3$" },
    { "id": "C", "text": "$1$" },
    { "id": "D", "text": "$0$" }
  ],
  "rating": 1000,
  "attempts": 0,
  "correctCount": 0,
  "status": "published",
  "authorId": "seed",
  "createdAt": "<Timestamp>"
}
```
- `level`: 1 = nhận biết, 2 = thông hiểu, 3 = vận dụng, 4 = vận dụng cao.
- `type`: `mcq` hoặc `short` (trả lời ngắn). Hãy kiểm tra cấu trúc đề thi hiện hành của Bộ GD&ĐT để quyết định có thêm dạng đúng/sai hay không; MVP chỉ cần `mcq` + `short`.
- `rating`: khởi tạo từ `level`, sau đó tự hiệu chỉnh theo dữ liệu làm bài.

**`questionKeys/{questionId}`** (chỉ server đọc)
```json
{
  "accepted": ["B"],
  "explanation": "Ta có $y' = 3x^2 - 3 = 0 \\Rightarrow x = \\pm 1$. ..."
}
```
> Ví dụ chỉ minh họa cấu trúc. Hãy tự kiểm tra lại đáp án của từng câu khi nạp dữ liệu thật.

**`users/{uid}`**
```json
{
  "displayName": "Nguyễn Văn A", "school": "THPT ...", "province": "Đà Nẵng",
  "grade": 12, "role": "student",
  "streak": 0, "lastActiveDate": "2026-10-14", "createdAt": "<Timestamp>"
}
```

**`users/{uid}/ratings/{ratingId}`**
```json
{ "rating": 1000, "attempts": 0, "correct": 0, "updatedAt": "<Timestamp>" }
```

**`attempts/{attemptId}`**
```json
{
  "uid": "...", "questionId": "...", "topicId": "...", "subject": "toan",
  "answer": "B", "correct": false, "timeMs": 42000,
  "ratingBefore": 1000, "ratingAfter": 981,
  "countedForRating": true, "contestId": null, "createdAt": "<Timestamp>"
}
```
Với contest, dùng **ID cố định** `${contestId}_${uid}_${questionId}` để mỗi câu chỉ nộp 1 lần.

**`contests/{contestId}`**
```json
{
  "title": "Contest Toán tuần 42", "subject": "toan",
  "startTime": "<Timestamp>", "endTime": "<Timestamp>", "durationMin": 45,
  "questionIds": ["q1","q2","q3","q4","q5"]
}
```

**`contests/{id}/participants/{uid}`**
```json
{ "displayName": "...", "school": "...", "startedAt": "<Timestamp>",
  "score": 0, "solved": 0, "lastCorrectAt": null }
```

**`solutions/{solutionId}`**
```json
{ "questionId": "...", "authorId": "...", "authorName": "...",
  "content": "markdown + LaTeX", "votes": 0, "pinned": false, "createdAt": "<Timestamp>" }
```

### 5.3. Chỉ mục (`firestore.indexes.json`)

```json
{
  "indexes": [
    {
      "collectionGroup": "questions", "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "topicId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "rating", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "participants", "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "score", "order": "DESCENDING" },
        { "fieldPath": "lastCorrectAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "entries", "queryScope": "COLLECTION",
      "fields": [{ "fieldPath": "rating", "order": "DESCENDING" }]
    },
    {
      "collectionGroup": "solutions", "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "questionId", "order": "ASCENDING" },
        { "fieldPath": "votes", "order": "DESCENDING" }
      ]
    }
  ]
}
```
Nếu Firestore báo thiếu index khi chạy query, thông báo lỗi có link tạo index, bấm vào là xong.

---

## 6. Thuật toán rating (Elo)

### 6.1. Ý tưởng
- Mỗi **học sinh** có rating theo từng **chuyên đề** và theo **môn**.
- Mỗi **câu hỏi** có rating độ khó, khởi tạo từ `level`, sau đó trôi theo dữ liệu thật: nhiều người sai thì rating câu hỏi tăng.
- Xác suất đúng kỳ vọng:

```
P = 1 / (1 + 10^((R_câu − R_học_sinh) / 400))
```

- Câu trắc nghiệm 4 đáp án có xác suất đoán trúng 25%, nên dùng `P' = c + (1 − c) × P` với `c = 0.25`. Với câu trả lời ngắn, `c = 0`.
- Cập nhật: `R_hs += K × (kết_quả − P')` và `R_câu −= K_câu × (kết_quả − P')`.

### 6.2. Tham số đề xuất

| Tham số | Giá trị | Ghi chú |
|---|---|---|
| Rating khởi tạo học sinh | 1000 | |
| Rating câu hỏi theo level | 800 / 1000 / 1200 / 1400 | level 1 → 4 |
| `K` học sinh | 40 nếu < 30 câu, 24 nếu < 100 câu, 16 sau đó | người mới biến động nhanh |
| Hệ số contest | × 1.5 | contest "nặng" hơn |
| `K` câu hỏi | 16 nếu < 50 lượt, 6 sau đó | ổn định khi đủ dữ liệu |
| Giới hạn | học sinh ≥ 100, câu hỏi 400–2400 | tránh lệch cực đoan |

### 6.3. Chống "farm rating"
Chỉ cập nhật rating ở **lần đầu** học sinh làm một câu (`users/{uid}/solved/{questionId}` chưa tồn tại). Làm lại vẫn được chấm và xem lời giải nhưng rating không đổi.

### 6.4. Code (`server/utils/elo.ts`)

```ts
export const DIFFICULTY_BASE: Record<number, number> = { 1: 800, 2: 1000, 3: 1200, 4: 1400 }
export const GUESS_FLOOR_MCQ = 0.25
export const DEFAULT_USER_RATING = 1000

export function expectedCorrect(userRating: number, questionRating: number, guess = 0): number {
  const p = 1 / (1 + Math.pow(10, (questionRating - userRating) / 400))
  return guess + (1 - guess) * p
}

export function kFactorUser(attempts: number, inContest: boolean): number {
  const base = attempts < 30 ? 40 : attempts < 100 ? 24 : 16
  return inContest ? base * 1.5 : base
}

export function kFactorQuestion(attempts: number): number {
  return attempts < 50 ? 16 : 6
}

export interface EloInput {
  userRating: number
  questionRating: number
  correct: boolean
  userAttempts: number
  questionAttempts: number
  guess: number          // 0.25 cho mcq, 0 cho short
  inContest: boolean
}

export interface EloResult {
  expected: number
  newUserRating: number
  newQuestionRating: number
}

export function updateRatings(i: EloInput): EloResult {
  const expected = expectedCorrect(i.userRating, i.questionRating, i.guess)
  const score = i.correct ? 1 : 0

  const newUser = i.userRating + kFactorUser(i.userAttempts, i.inContest) * (score - expected)
  const newQ = i.questionRating - kFactorQuestion(i.questionAttempts) * (score - expected)

  return {
    expected,
    newUserRating: Math.max(100, Math.round(newUser)),
    newQuestionRating: Math.min(2400, Math.max(400, Math.round(newQ * 10) / 10)),
  }
}
```

### 6.5. Unit test (`server/utils/elo.test.ts`)

```ts
import { describe, it, expect } from 'vitest'
import { expectedCorrect, updateRatings } from './elo'

describe('elo', () => {
  it('cân bằng khi rating bằng nhau', () => {
    expect(expectedCorrect(1000, 1000)).toBeCloseTo(0.5, 5)
  })
  it('đúng câu khó thì tăng nhiều hơn câu dễ', () => {
    const base = { userRating: 1000, correct: true, userAttempts: 10, questionAttempts: 100, guess: 0, inContest: false }
    const hard = updateRatings({ ...base, questionRating: 1400 })
    const easy = updateRatings({ ...base, questionRating: 800 })
    expect(hard.newUserRating - 1000).toBeGreaterThan(easy.newUserRating - 1000)
  })
  it('sai thì rating giảm', () => {
    const r = updateRatings({ userRating: 1000, questionRating: 1000, correct: false,
      userAttempts: 10, questionAttempts: 100, guess: 0, inContest: false })
    expect(r.newUserRating).toBeLessThan(1000)
  })
})
```
Chạy: `npx vitest run`. File test import tương đối nên không cần cấu hình Nuxt.

### 6.4b. "Độ khó thực tế"
Ngoài rating, hiện thêm tỉ lệ làm đúng `correctCount / attempts` (chỉ hiện khi `attempts ≥ 20`). Đây chính là điểm "độ khó tính từ dữ liệu thật" trong phần thuyết trình.

---

## 7. Backend: Nitro server routes

Quy ước Nitro: tên file quyết định đường dẫn và method.
`server/api/attempts.post.ts` → `POST /api/attempts`; `[id]` là tham số, đọc bằng `getRouterParam(event, 'id')`.

### 7.1. Tiện ích

`server/utils/date.ts`
```ts
const TZ = 'Asia/Ho_Chi_Minh'
export const vnDate = (d = new Date()) => d.toLocaleDateString('sv-SE', { timeZone: TZ }) // YYYY-MM-DD
export const vnYesterday = () => vnDate(new Date(Date.now() - 24 * 3600 * 1000))
```

`server/utils/answer.ts`
```ts
export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '').replace(',', '.')
}

export function checkAnswer(type: 'mcq' | 'short', answer: string, accepted: string[]): boolean {
  if (type === 'mcq') return accepted.includes(answer)
  const a = normalizeAnswer(answer)
  return accepted.some((x) => {
    const b = normalizeAnswer(x)
    if (a === b) return true
    const na = Number(a), nb = Number(b)
    return Number.isFinite(na) && Number.isFinite(nb) && Math.abs(na - nb) < 1e-6
  })
}
```

### 7.2. `POST /api/attempts` — chấm bài + cập nhật rating

API quan trọng nhất. Quy tắc Firestore transaction: **đọc hết trước, ghi sau**.

`server/api/attempts.post.ts`
```ts
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import type { DocumentData, DocumentReference } from 'firebase-admin/firestore'

const CONTEST_POINTS: Record<number, number> = { 1: 100, 2: 150, 3: 200, 4: 300 }
const GRACE_MS = 5000 // du di mạng

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{
    questionId?: string; answer?: string; contestId?: string | null; timeMs?: number
  }>(event)

  const { questionId, answer, contestId = null } = body ?? {}
  const timeMs = Math.max(0, Math.min(Number(body?.timeMs) || 0, 3_600_000))
  if (!questionId || typeof answer !== 'string' || answer.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'bad_request' })
  }

  const db = getDb()
  const uid = user.uid

  return await db.runTransaction(async (tx) => {
    // ---------- 1) ĐỌC ----------
    const qRef = db.doc(`questions/${questionId}`)
    const kRef = db.doc(`questionKeys/${questionId}`)
    const uRef = db.doc(`users/${uid}`)
    const solvedRef = db.doc(`users/${uid}/solved/${questionId}`)

    const [qSnap, kSnap, uSnap, solvedSnap] = await Promise.all(
      [qRef, kRef, uRef, solvedRef].map((r) => tx.get(r)),
    )
    if (!qSnap.exists || !kSnap.exists) {
      throw createError({ statusCode: 404, statusMessage: 'question_not_found' })
    }
    const q = qSnap.data()!
    const key = kSnap.data()!

    const topicRef = db.doc(`users/${uid}/ratings/${q.topicId}`)
    const subjectRef = db.doc(`users/${uid}/ratings/subject_${q.subject}`)
    const [topicSnap, subjectSnap] = await Promise.all([topicRef, subjectRef].map((r) => tx.get(r)))

    // contest (nếu có)
    let partRef: DocumentReference | undefined
    let attemptRef: DocumentReference = db.collection('attempts').doc()
    if (contestId) {
      const cRef = db.doc(`contests/${contestId}`)
      partRef = db.doc(`contests/${contestId}/participants/${uid}`)
      attemptRef = db.doc(`attempts/${contestId}_${uid}_${questionId}`)

      const [cSnap, pSnap, aSnap] = await Promise.all([cRef, partRef, attemptRef].map((r) => tx.get(r)))
      if (!cSnap.exists || !pSnap.exists) throw createError({ statusCode: 403, statusMessage: 'not_in_contest' })
      if (aSnap.exists) throw createError({ statusCode: 409, statusMessage: 'already_submitted' })

      const contest = cSnap.data() as DocumentData
      if (!contest.questionIds.includes(questionId)) {
        throw createError({ statusCode: 400, statusMessage: 'question_not_in_contest' })
      }
      const deadline =
        Math.min(
          contest.endTime.toMillis(),
          pSnap.data()!.startedAt.toMillis() + contest.durationMin * 60_000,
        ) + GRACE_MS
      if (Date.now() > deadline) throw createError({ statusCode: 403, statusMessage: 'contest_over' })
    }

    // ---------- 2) TÍNH ----------
    const correct = checkAnswer(q.type, answer, key.accepted)
    const guess = q.type === 'mcq' ? GUESS_FLOOR_MCQ : 0
    const firstTime = !solvedSnap.exists
    const inContest = !!contestId

    const topicR = topicSnap.data() ?? { rating: DEFAULT_USER_RATING, attempts: 0, correct: 0 }
    const subjectR = subjectSnap.data() ?? { rating: DEFAULT_USER_RATING, attempts: 0, correct: 0 }

    let ratingAfter = topicR.rating as number
    let newQuestionRating = q.rating as number
    let newSubjectRating = subjectR.rating as number

    if (firstTime) {
      const t = updateRatings({
        userRating: topicR.rating, questionRating: q.rating, correct,
        userAttempts: topicR.attempts, questionAttempts: q.attempts, guess, inContest,
      })
      const s = updateRatings({
        userRating: subjectR.rating, questionRating: q.rating, correct,
        userAttempts: subjectR.attempts, questionAttempts: q.attempts, guess, inContest,
      })
      ratingAfter = t.newUserRating
      newQuestionRating = t.newQuestionRating
      newSubjectRating = s.newUserRating
    }

    // streak
    const today = vnDate()
    const last = uSnap.data()?.lastActiveDate as string | undefined
    const prevStreak = (uSnap.data()?.streak as number | undefined) ?? 0
    const streak = last === today ? prevStreak : last === vnYesterday() ? prevStreak + 1 : 1

    // ---------- 3) GHI ----------
    tx.set(attemptRef, {
      uid, questionId, topicId: q.topicId, subject: q.subject,
      answer, correct, timeMs, contestId,
      ratingBefore: topicR.rating, ratingAfter,
      countedForRating: firstTime,
      createdAt: FieldValue.serverTimestamp(),
    })

    if (firstTime) {
      tx.set(topicRef, {
        rating: ratingAfter,
        attempts: FieldValue.increment(1),
        correct: FieldValue.increment(correct ? 1 : 0),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })

      tx.set(subjectRef, {
        rating: newSubjectRating,
        attempts: FieldValue.increment(1),
        correct: FieldValue.increment(correct ? 1 : 0),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })

      tx.update(qRef, {
        rating: newQuestionRating,
        attempts: FieldValue.increment(1),
        correctCount: FieldValue.increment(correct ? 1 : 0),
      })

      tx.set(solvedRef, { topicId: q.topicId, correct, at: FieldValue.serverTimestamp() })

      tx.set(db.doc(`leaderboards/${q.subject}/entries/${uid}`), {
        displayName: uSnap.data()?.displayName ?? user.name ?? 'Ẩn danh',
        school: uSnap.data()?.school ?? '',
        province: uSnap.data()?.province ?? '',
        rating: newSubjectRating,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
    }

    tx.set(uRef, { streak, lastActiveDate: today }, { merge: true })
    tx.set(db.doc(`users/${uid}/activity/${today}`), { count: FieldValue.increment(1) }, { merge: true })

    if (contestId && partRef) {
      const gained = correct ? CONTEST_POINTS[q.level] ?? 100 : 0
      const upd: Record<string, unknown> = { score: FieldValue.increment(gained) }
      if (correct) {
        upd.solved = FieldValue.increment(1)
        upd.lastCorrectAt = Timestamp.now()
      }
      tx.update(partRef, upd)
    }

    return {
      correct,
      firstTime,
      ratingBefore: topicR.rating as number,
      ratingAfter,
      // trong contest: chưa lộ lời giải và đáp án, chỉ lộ sau khi contest kết thúc
      explanation: inContest ? null : (key.explanation as string),
      correctAnswer: inContest ? null : (key.accepted as string[]),
    }
  })
})
```

> Ghi chú hiệu năng: `tx.update(qRef, …)` ghi vào document câu hỏi nên nhiều người làm cùng lúc sẽ tranh chấp (contention). Với quy mô hackathon thì ổn. Nếu lo, tách cập nhật rating câu hỏi thành tác vụ gom theo lô chạy định kỳ.

### 7.3. `GET /api/recommend?topicId=...` — gợi ý câu vừa sức

Chọn câu có rating trong khoảng `[R_hs − 100, R_hs + 250]` (hơi khó hơn một chút để học tiếp), loại những câu đã làm.

`server/api/recommend.get.ts`
```ts
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const topicId = String(getQuery(event).topicId ?? '')
  if (!topicId) throw createError({ statusCode: 400, statusMessage: 'bad_request' })

  const db = getDb()
  const rSnap = await db.doc(`users/${user.uid}/ratings/${topicId}`).get()
  const r = (rSnap.data()?.rating as number) ?? DEFAULT_USER_RATING

  const [cands, solved] = await Promise.all([
    db.collection('questions')
      .where('topicId', '==', topicId)
      .where('status', '==', 'published')
      .where('rating', '>=', r - 100)
      .where('rating', '<=', r + 250)
      .limit(40)
      .get(),
    db.collection(`users/${user.uid}/solved`).where('topicId', '==', topicId).get(),
  ])

  const done = new Set(solved.docs.map((d) => d.id))
  const questions = cands.docs
    .filter((d) => !done.has(d.id))
    .slice(0, 10)
    .map((d) => ({ id: d.id, ...d.data() }))

  return { userRating: r, questions }
})
```

### 7.4. Lời giải cộng đồng

`server/api/solutions/index.post.ts` — chỉ cho người **đã làm câu đó** đăng lời giải để tránh spam:
```ts
import { FieldValue } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { questionId, content } = await readBody<{ questionId?: string; content?: string }>(event) ?? {}
  if (!questionId || !content || content.length < 20 || content.length > 4000) {
    throw createError({ statusCode: 400, statusMessage: 'bad_request' })
  }

  const db = getDb()
  const solved = await db.doc(`users/${user.uid}/solved/${questionId}`).get()
  if (!solved.exists) throw createError({ statusCode: 403, statusMessage: 'not_attempted' })

  const u = (await db.doc(`users/${user.uid}`).get()).data()
  const ref = await db.collection('solutions').add({
    questionId, content,
    authorId: user.uid,
    authorName: u?.displayName ?? user.name ?? 'Ẩn danh',
    votes: 0, pinned: false,
    createdAt: FieldValue.serverTimestamp(),
  })
  return { id: ref.id }
})
```

`server/api/solutions/[id]/vote.post.ts` — bật/tắt vote bằng transaction:
```ts
import { FieldValue } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  const db = getDb()
  const sRef = db.doc(`solutions/${id}`)
  const vRef = db.doc(`solutions/${id}/votes/${user.uid}`)

  const voted = await db.runTransaction(async (tx) => {
    const [s, v] = await Promise.all([tx.get(sRef), tx.get(vRef)])
    if (!s.exists) throw createError({ statusCode: 404, statusMessage: 'not_found' })
    if (s.data()!.authorId === user.uid) throw createError({ statusCode: 400, statusMessage: 'self_vote' })

    if (v.exists) {
      tx.delete(vRef)
      tx.update(sRef, { votes: FieldValue.increment(-1) })
      return false
    }
    tx.set(vRef, { at: FieldValue.serverTimestamp() })
    tx.update(sRef, { votes: FieldValue.increment(1) })
    return true
  })
  return { voted }
})
```
Huy hiệu "Lời giải xuất sắc": hiển thị khi `votes ≥ 10` hoặc giáo viên đặt `pinned = true`.

### 7.5. Daily challenge
Tạo thủ công `daily/{yyyy-mm-dd}` với `questionId` cho 7 ngày demo. Streak đã được tính trong `/api/attempts`, không cần endpoint riêng.

---

## 8. Contest hằng tuần

### 8.1. Vòng đời
`scheduled` → (đến `startTime`) → `running` → (qua `endTime`) → `finished`.
Không cần cron: suy ra trạng thái bằng cách so thời gian hiện tại với `startTime`/`endTime`.

### 8.2. Tham gia — `POST /api/contests/[id]/join`

Trả về câu hỏi (đã bỏ rating để không lộ độ khó), thời điểm bắt đầu và **giờ server** để client bù lệch đồng hồ.

`server/api/contests/[id]/join.post.ts`
```ts
import { Timestamp } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')!
  const db = getDb()

  const cSnap = await db.doc(`contests/${id}`).get()
  if (!cSnap.exists) throw createError({ statusCode: 404, statusMessage: 'not_found' })
  const c = cSnap.data()!

  const now = Date.now()
  if (now < c.startTime.toMillis()) throw createError({ statusCode: 403, statusMessage: 'not_started' })
  if (now > c.endTime.toMillis()) throw createError({ statusCode: 403, statusMessage: 'ended' })

  const pRef = db.doc(`contests/${id}/participants/${user.uid}`)
  if (!(await pRef.get()).exists) {
    const u = (await db.doc(`users/${user.uid}`).get()).data()
    await pRef.set({
      displayName: u?.displayName ?? user.name ?? 'Ẩn danh',
      school: u?.school ?? '',
      startedAt: Timestamp.now(),
      score: 0, solved: 0, lastCorrectAt: null,
    })
  }
  const p = (await pRef.get()).data()!

  const qs = await Promise.all(c.questionIds.map((qid: string) => db.doc(`questions/${qid}`).get()))
  const questions = qs.map((d) => {
    const { rating, attempts, correctCount, ...pub } = d.data()!
    return { id: d.id, ...pub }
  })

  return {
    serverNow: Date.now(),
    startedAt: p.startedAt.toMillis() as number,
    durationMin: c.durationMin as number,
    endTime: c.endTime.toMillis() as number,
    questions,
  }
})
```

### 8.3. Phòng thi (client)
- Hạn nộp = `min(endTime, startedAt + durationMin)`. Bù lệch đồng hồ: `offset = serverNow − Date.now()` lúc nhận phản hồi `join`, rồi đếm ngược theo `Date.now() + offset`. Server vẫn kiểm tra hạn nộp thật (đã có trong `/api/attempts`).
- Mỗi câu chỉ nộp **một lần**. Nộp xong khóa câu đó. Trong contest, server không trả đáp án đúng và lời giải; UI chỉ hiện "Đã nộp".
- Xáo thứ tự câu và đáp án theo seed `uid + questionId` (đáp án gửi lên là `id` A/B/C/D nên không ảnh hưởng việc chấm).

`app/utils/shuffle.ts` (tự động import ở phía app)
```ts
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const rnd = mulberry32(hash(seed))
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}
```

`app/composables/useCountdown.ts`
```ts
export function useCountdown(deadlineMs: Ref<number>, clockOffsetMs: Ref<number>) {
  const left = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined

  const tick = () => {
    left.value = Math.max(0, deadlineMs.value - (Date.now() + clockOffsetMs.value))
  }

  onMounted(() => {
    tick()
    timer = setInterval(tick, 500)
  })
  onUnmounted(() => clearInterval(timer))

  return { left }
}
```

### 8.4. Bảng xếp hạng realtime

`app/components/ContestLeaderboard.vue`
```vue
<script setup lang="ts">
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'

const props = defineProps<{ contestId: string }>()
const { $db } = useNuxtApp()
const rows = ref<any[]>([])
let unsub: (() => void) | undefined

onMounted(() => {
  const q = query(
    collection($db, `contests/${props.contestId}/participants`),
    orderBy('score', 'desc'),
    orderBy('lastCorrectAt', 'asc'),
    limit(50),
  )
  unsub = onSnapshot(q, (snap) => {
    rows.value = snap.docs.map((d, i) => ({ rank: i + 1, id: d.id, ...d.data() }))
  })
})
onUnmounted(() => unsub?.())
</script>

<template>
  <table class="w-full text-sm">
    <thead>
      <tr><th>#</th><th>Tên</th><th>Trường</th><th>Điểm</th><th>Câu đúng</th></tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="r.id">
        <td>{{ r.rank }}</td><td>{{ r.displayName }}</td><td>{{ r.school }}</td>
        <td>{{ r.score }}</td><td>{{ r.solved }}</td>
      </tr>
    </tbody>
  </table>
</template>
```
Nhớ hủy `onSnapshot` trong `onUnmounted` để không rò rỉ listener khi chuyển trang.

### 8.5. Rating sau contest
MVP: rating đổi ngay theo từng câu với hệ số ×1.5. Nâng cấp sau hackathon: tính thay đổi rating theo **hạng** (kiểu Codeforces/Elo-MMR) sau khi contest kết thúc.

---

## 9. Tích hợp AI (Gemini)

### 9.1. Mục tiêu
Sau khi học sinh **làm sai** (và ngoài contest), AI đưa ra:
1. Nhầm lẫn khái niệm có thể đã xảy ra.
2. Giải thích ngắn, dễ hiểu, bám theo lời giải giáo viên.
3. Một mẹo để tránh lỗi tương tự.

### 9.2. Nguyên tắc
- AI **bổ sung**, không thay lời giải giáo viên. Luôn hiển thị nhãn "Giải thích do AI tạo, có thể sai".
- Đưa vào prompt: đề, lựa chọn, đáp án đúng, lời giải giáo viên, đáp án học sinh đã chọn.
- Trả về **JSON** để dễ hiển thị.
- Giới hạn lượt gọi mỗi người dùng mỗi ngày; **cache** theo `(questionId, answer)`.
- Không cho gọi AI cho câu mà user chưa làm (tránh lấy đáp án qua AI) và không gọi trong contest.

### 9.3. Code

`server/api/ai/explain.post.ts`
```ts
import { createHash } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { GoogleGenAI } from '@google/genai'

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
  const { questionId, answer } = await readBody<{ questionId?: string; answer?: string }>(event) ?? {}
  if (!questionId || typeof answer !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'bad_request' })
  }

  const db = getDb()
  const cfg = useRuntimeConfig()

  // 1) phải đã làm câu này
  const solved = await db.doc(`users/${user.uid}/solved/${questionId}`).get()
  if (!solved.exists) throw createError({ statusCode: 403, statusMessage: 'not_attempted' })

  const [q, k] = await Promise.all([
    db.doc(`questions/${questionId}`).get(),
    db.doc(`questionKeys/${questionId}`).get(),
  ])
  if (!q.exists || !k.exists) throw createError({ statusCode: 404, statusMessage: 'not_found' })
  const qd = q.data()!, kd = k.data()!

  // 2) cache
  const cacheId = createHash('sha1').update(`${questionId}|${answer}`).digest('hex')
  const cacheRef = db.doc(`aiCache/${cacheId}`)
  const cached = await cacheRef.get()
  if (cached.exists) return { ...cached.data(), aiGenerated: true, cached: true }

  // 3) giới hạn lượt/ngày
  const quotaRef = db.doc(`users/${user.uid}/quota/ai_${vnDate()}`)
  const used = (await quotaRef.get()).data()?.count ?? 0
  if (used >= DAILY_LIMIT) throw createError({ statusCode: 429, statusMessage: 'quota_exceeded' })

  const prompt = `ĐỀ: ${qd.content}
CÁC LỰA CHỌN: ${JSON.stringify(qd.choices ?? [])}
ĐÁP ÁN ĐÚNG: ${JSON.stringify(kd.accepted)}
LỜI GIẢI THAM CHIẾU (giáo viên): ${kd.explanation}
HỌC SINH ĐÃ CHỌN: ${answer}`

  try {
    const ai = new GoogleGenAI({ apiKey: cfg.geminiApiKey })
    const res = await ai.models.generateContent({
      model: cfg.geminiModel,
      contents: prompt,
      config: { systemInstruction: SYSTEM, responseMimeType: 'application/json', temperature: 0.3 },
    })
    const data = JSON.parse(res.text ?? '{}')

    await Promise.all([
      quotaRef.set({ count: FieldValue.increment(1) }, { merge: true }),
      cacheRef.set({ ...data, createdAt: FieldValue.serverTimestamp() }),
    ])
    return { ...data, aiGenerated: true }
  } catch (e) {
    console.error('Gemini error', e)
    // Fallback: trả lời giải giáo viên khi AI lỗi (rất quan trọng khi demo)
    return { misconception: '', explanation: kd.explanation, tip: '', aiGenerated: false }
  }
})
```

### 9.4. Mẹo cho demo
- Chạy thử trước vài câu để cache sẵn các đáp án sẽ dùng khi demo.
- Luôn có **fallback** về lời giải giáo viên nếu API lỗi hoặc hết quota.
- Kiểm tra kỹ vài câu AI trả lời; môn Toán/Lý có thể sai bước tính. Ưu tiên câu đã thử ổn định.

### 9.5. (P2) Gợi ý câu hỏi tương tự cho giáo viên
Prompt sinh bản nháp biến thể của một câu hỏi, lưu `status: "pending"` để giáo viên duyệt rồi mới `published`. Không cho AI tự đăng.

---

## 10. Frontend: trang, composable, component

### 10.1. Danh sách trang

| Trang | Chức năng chính | Ưu tiên |
|---|---|---|
| `/login` | Đăng nhập Google, hỏi trường/tỉnh/lớp lần đầu | P0 |
| `/practice` | Chọn môn → chuyên đề kèm rating của bạn | P0 |
| `/practice/[id]` | Làm 1 câu, nộp, xem đúng/sai + rating +/-, nút "Vì sao mình sai?" | P0 |
| `/contests` | Danh sách contest, đếm ngược tới giờ bắt đầu | P0 |
| `/contests/[id]` | Phòng thi + bảng xếp hạng | P0 |
| `/profile` | Rating từng chuyên đề (radar), streak, heatmap | P1 |
| Khu vực lời giải (trong `/practice/[id]`) | Xem/đăng/vote lời giải | P1 |
| `/teacher` | Thống kê lớp: chuyên đề yếu nhất | P1 |

### 10.2. Component Markdown + KaTeX (có làm sạch HTML)

Nội dung do người dùng đăng (lời giải cộng đồng) sẽ được render bằng `v-html`, nên **bắt buộc sanitize** bằng DOMPurify để chống XSS.

`app/components/AppMarkdown.vue`
```vue
<script setup lang="ts">
import { marked } from 'marked'
import markedKatex from 'marked-katex-extension'
import DOMPurify from 'dompurify'
import 'katex/dist/katex.min.css'

marked.use(markedKatex({ throwOnError: false }))

const props = defineProps<{ source: string }>()

const html = computed(() =>
  DOMPurify.sanitize(marked.parse(props.source ?? '', { async: false }) as string),
)
</script>

<template>
  <div class="markdown-body" v-html="html" />
</template>
```
Sau khi làm xong, test thử vài công thức để chắc rằng DOMPurify không cắt mất phần hiển thị của KaTeX. Nếu bị, điều chỉnh cấu hình sanitize cho phù hợp.

### 10.3. Trang làm 1 câu hỏi (khung mẫu)

`app/pages/practice/[id].vue`
```vue
<script setup lang="ts">
import { doc, getDoc } from 'firebase/firestore'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { $db } = useNuxtApp()
const { user } = useAuthUser()
const api = useApi()

const question = ref<any>(null)
const choice = ref('')
const result = ref<any>(null)
const ai = ref<any>(null)
const loading = ref(false)
const startedAt = ref(Date.now())

onMounted(async () => {
  const snap = await getDoc(doc($db, 'questions', route.params.id as string))
  question.value = snap.exists() ? { id: snap.id, ...snap.data() } : null
  startedAt.value = Date.now()
})

const choices = computed(() =>
  question.value?.choices
    ? seededShuffle(question.value.choices, `${user.value?.uid}:${question.value.id}`)
    : [],
)

async function submit() {
  loading.value = true
  try {
    result.value = await api('/api/attempts', {
      method: 'POST',
      body: { questionId: question.value.id, answer: choice.value, timeMs: Date.now() - startedAt.value },
    })
  } finally {
    loading.value = false
  }
}

async function explain() {
  ai.value = await api('/api/ai/explain', {
    method: 'POST',
    body: { questionId: question.value.id, answer: choice.value },
  })
}
</script>

<template>
  <div v-if="question" class="mx-auto max-w-2xl p-4">
    <AppMarkdown :source="question.content" />

    <div class="mt-4 space-y-2">
      <label v-for="c in choices" :key="c.id" class="flex gap-2 rounded border p-3">
        <input v-model="choice" type="radio" :value="c.id" :disabled="!!result" />
        <AppMarkdown :source="c.text" />
      </label>
    </div>

    <button class="mt-4 rounded bg-blue-600 px-4 py-2 text-white" :disabled="!choice || !!result || loading" @click="submit">
      Nộp bài
    </button>

    <div v-if="result" class="mt-4">
      <p :class="result.correct ? 'text-green-600' : 'text-red-600'">
        {{ result.correct ? 'Chính xác!' : 'Chưa đúng' }}
        <span v-if="result.firstTime">
          — Rating: {{ result.ratingBefore }} → {{ result.ratingAfter }}
          ({{ result.ratingAfter - result.ratingBefore >= 0 ? '+' : '' }}{{ result.ratingAfter - result.ratingBefore }})
        </span>
      </p>

      <AppMarkdown v-if="result.explanation" :source="result.explanation" />

      <button v-if="!result.correct" class="mt-2 underline" @click="explain">Vì sao mình sai?</button>

      <div v-if="ai" class="mt-2 rounded border p-3">
        <p class="text-xs text-gray-500">
          {{ ai.aiGenerated ? 'Giải thích do AI tạo, có thể chưa chính xác.' : 'Lời giải của giáo viên.' }}
        </p>
        <AppMarkdown :source="ai.explanation" />
        <AppMarkdown v-if="ai.tip" :source="'**Mẹo:** ' + ai.tip" />
      </div>
    </div>
  </div>
</template>
```

### 10.4. Luồng UI
1. Hiện đề + lựa chọn (xáo thứ tự theo seed).
2. Bấm **Nộp** → `/api/attempts` → hiệu ứng rating `1000 → 1024 (+24)`.
3. Hiện lời giải giáo viên. Nếu sai, hiện nút **"Vì sao mình sai?"** gọi AI.
4. Nút **"Câu tiếp theo (vừa sức)"** gọi `/api/recommend`.

### 10.5. Heatmap (P1)
Đọc `users/{uid}/activity` của 12 tuần gần nhất, vẽ lưới 7×N ô bằng `div` + Tailwind (màu theo `count`). Không cần thư viện.

### 10.6. Radar rating theo chuyên đề (P1)
Dùng `vue-chartjs` (`Radar`) hiển thị rating từng chuyên đề. Rất hợp để nói "biết rõ mình yếu chuyên đề nào".

### 10.7. Ghi chú UI/UX
- Mobile-first: học sinh dùng điện thoại là chính.
- Trạng thái rõ ràng: đang chấm, lỗi mạng, hết giờ.
- Hiển thị rating độ khó của câu hỏi **sau khi nộp**; trong contest thì ẩn.

---

## 11. Bảo mật và chống gian lận

### 11.1. Firestore Security Rules (`firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }

    match /topics/{id} { allow read: if true; allow write: if false; }

    match /questions/{id} {
      allow read: if signedIn() && resource.data.status == 'published';
      allow write: if false;
    }

    // Đáp án: tuyệt đối không cho client đọc/ghi
    match /questionKeys/{id} { allow read, write: if false; }

    match /users/{uid} {
      allow read: if isOwner(uid);
      allow create: if isOwner(uid);
      allow update: if isOwner(uid)
        && request.resource.data.diff(resource.data).affectedKeys()
           .hasOnly(['displayName','school','province','grade']);
      match /{sub}/{doc} {
        allow read: if isOwner(uid);
        allow write: if false;   // chỉ server ghi rating, solved, activity, quota
      }
    }

    match /attempts/{id} {
      allow read: if signedIn() && resource.data.uid == request.auth.uid;
      allow write: if false;
    }

    match /leaderboards/{subject}/entries/{uid} {
      allow read: if signedIn();
      allow write: if false;
    }

    match /contests/{id} {
      allow read: if signedIn();
      allow write: if false;
      match /participants/{uid} {
        allow read: if signedIn();
        allow write: if false;
      }
    }

    match /solutions/{id} {
      allow read: if signedIn();
      allow write: if false;     // tạo qua API để kiểm tra điều kiện
      match /votes/{uid} { allow read: if isOwner(uid); allow write: if false; }
    }

    match /daily/{id} { allow read: if signedIn(); allow write: if false; }
    match /aiCache/{id} { allow read, write: if false; }
  }
}
```

> Vì `contests/{id}` cho phép đọc `questionIds`, học sinh có thể đoán ID câu hỏi và xem đề trước giờ thi. Để contest nghiêm túc hơn, chuyển `questionIds` vào `contests/{id}/private/set` (chỉ server đọc) và chỉ trả câu hỏi qua API `join`.

### 11.2. Chống gian lận cơ bản

| Rủi ro | Biện pháp |
|---|---|
| Lấy đáp án từ client | Đáp án ở `questionKeys`, rules cấm đọc |
| Nộp nhiều lần để đoán | Contest: ID attempt cố định, 1 lần/câu |
| Nộp sau giờ | Server kiểm tra `deadline` |
| Farm rating bằng câu dễ | Chỉ tính rating lần đầu |
| Sao chép nhau trong contest | Xáo thứ tự câu/đáp án theo seed (giảm, không triệt tiêu) |
| Spam AI | Giới hạn 20 lượt/ngày + cache + chỉ gọi khi đã làm câu |
| Spam lời giải | Chỉ người đã làm câu mới đăng; giới hạn độ dài; nút báo cáo |
| XSS qua lời giải cộng đồng | Luôn sanitize bằng DOMPurify trước `v-html` |
| Lộ khóa bí mật | Khóa chỉ nằm trong `runtimeConfig` phía server (không đặt trong `public`) |

### 11.3. Quyền riêng tư
- Học sinh có thể là trẻ vị thành niên. Chỉ thu thông tin tối thiểu (tên hiển thị, trường, tỉnh, lớp), cho phép dùng **biệt danh** trên bảng xếp hạng.
- Có trang chính sách dữ liệu ngắn, nêu rõ dữ liệu dùng để làm gì.

---

## 12. Nạp dữ liệu (seed)

### 12.1. Định dạng `data/questions.json`

```json
[
  {
    "id": "toan12_dh_001",
    "subject": "toan",
    "topicId": "toan12_dao-ham-cuc-tri",
    "level": 2,
    "type": "mcq",
    "content": "Nội dung đề với công thức $x^2$...",
    "choices": [
      {"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}
    ],
    "accepted": ["C"],
    "explanation": "Lời giải chi tiết..."
  }
]
```

### 12.2. Script (`scripts/seed.ts`)

Script chạy **ngoài Nuxt** nên không dùng được `useRuntimeConfig()`. Nó tự đọc biến môi trường từ `.env` (cùng tên `NUXT_FIREBASE_*`).

```ts
import 'dotenv/config'
import fs from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { DIFFICULTY_BASE } from '../server/utils/elo'

initializeApp({
  credential: cert({
    projectId: process.env.NUXT_FIREBASE_PROJECT_ID,
    clientEmail: process.env.NUXT_FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.NUXT_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
})
const db = getFirestore()

async function main() {
  const items = JSON.parse(fs.readFileSync('data/questions.json', 'utf8'))
  let batch = db.batch()
  let n = 0

  for (const it of items) {
    const { accepted, explanation, id, ...pub } = it
    batch.set(db.doc(`questions/${id}`), {
      ...pub,
      rating: DIFFICULTY_BASE[it.level] ?? 1000,
      attempts: 0, correctCount: 0,
      status: 'published', authorId: 'seed',
      createdAt: FieldValue.serverTimestamp(),
    })
    batch.set(db.doc(`questionKeys/${id}`), { accepted, explanation })

    n++
    if (n % 200 === 0) { await batch.commit(); batch = db.batch() } // tối đa 500 thao tác/batch
  }
  await batch.commit()
  console.log(`Seeded ${n} questions`)
}
main()
```
Chạy: `npx tsx scripts/seed.ts`.

> Nếu muốn seed vào Emulator, đặt `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` trước khi chạy (Admin SDK sẽ tự nhận).

### 12.3. Nguồn nội dung
- Ưu tiên đề minh họa công khai của Bộ GD&ĐT và câu hỏi do **đội tự soạn** hoặc giáo viên cộng tác.
- Không sao chép đề của trung tâm/website có bản quyền.
- Gắn `authorId` để truy vết nguồn.
- Có thể dùng Gemini để **soạn nháp**, nhưng người thật phải kiểm đáp án trước khi `published`.

### 12.4. Dữ liệu mẫu cho demo
- Tạo 20–50 tài khoản bot với rating phân bố hợp lý để bảng xếp hạng không trống.
- **Ghi rõ "dữ liệu mẫu" khi trình bày.** Tốt nhất kéo vài lớp/bạn bè dùng thử thật và chụp số liệu.

---

## 13. Kế hoạch triển khai theo giai đoạn

> Điều chỉnh theo số ngày thực tế của hackathon. Ước lượng cho nhóm 3–4 người.

| Giai đoạn | Mục tiêu | Đầu ra kiểm tra được |
|---|---|---|
| **0. Setup** (0.5 ngày) | Repo Nuxt, Firebase project, env, plugin Firebase, deploy "hello world" | Trang chạy trên URL thật, đăng nhập Google được |
| **1. Dữ liệu** (0.5–1 ngày, song song) | Soạn 150+ câu, seed script, topics | Firestore có câu hỏi, đáp án nằm riêng tư |
| **2. Lõi làm bài** (1 ngày) | `/api/attempts`, Elo, trang làm câu, hiển thị rating | Làm 1 câu → rating đổi, ghi attempt |
| **3. Gợi ý + hồ sơ** (0.5 ngày) | `/api/recommend`, trang chuyên đề, profile cơ bản | Có luồng "câu tiếp theo vừa sức" |
| **4. Contest** (1 ngày) | Tạo contest, join, phòng thi, leaderboard realtime | 2 người thi cùng lúc thấy bảng xếp hạng đổi |
| **5. AI** (0.5 ngày) | `/api/ai/explain`, UI, cache, fallback | Sai 1 câu → có giải thích AI |
| **6. P1** (tùy thời gian) | Streak, heatmap, lời giải + vote, dashboard giáo viên | |
| **7. Hoàn thiện** (1 ngày) | Responsive, lỗi/loading, test, seed demo, slide, video dự phòng | Chạy trơn tru theo kịch bản demo |

**Quy tắc vàng:** sau mỗi giai đoạn đều phải có bản **deploy chạy được**. Đừng để đến ngày cuối mới ghép.

---

## 14. Phân công nhóm

| Vai trò | Nhiệm vụ chính |
|---|---|
| **Backend/Logic** | `server/api/*`, Elo, contest, rules, indexes, test thuật toán |
| **Frontend** | Pages, components, composables, leaderboard, responsive |
| **Nội dung + QA** | Soạn/kiểm câu hỏi, tag chuyên đề, đáp án, kiểm AI, test thủ công |
| **AI + Demo/Pitch** | Prompt Gemini, cache/fallback, slide, kịch bản demo, video dự phòng |

Nhóm 3 người: gộp "AI + Demo" vào Backend hoặc Nội dung. Nhóm 2 người: cắt P1, giữ P0.

---

## 15. Test, deploy, kịch bản demo

### 15.1. Test
- **Unit test:** `elo.ts`, `answer.ts` bằng Vitest.
- **Emulator:** `firebase emulators:start`. Khi dev, đặt `NUXT_PUBLIC_USE_EMULATOR=true` (client) và `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`, `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` (server) để không đụng dữ liệu thật.
- **Test thủ công trước demo:** 2 trình duyệt/2 tài khoản cùng vào contest; thử nộp trễ giờ; thử nộp hai lần; thử gọi AI khi hết quota; thử đáp án rỗng/dài bất thường.

### 15.2. Build và deploy với Nitro

```bash
npm run build                          # tạo thư mục .output
node .output/server/index.mjs          # chạy thử bản production (mặc định cổng 3000)
```

**Cloud Run (Docker)** — `Dockerfile`:
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
```

```bash
gcloud run deploy AllForOne --source . --region asia-southeast1 --allow-unauthenticated
# đặt biến môi trường NUXT_* trong Cloud Run; khóa bí mật nên để trong Secret Manager
```

Các lựa chọn khác: Vercel/Netlify (Nitro tự nhận preset). Hãy kiểm tra tài liệu hiện hành của nền tảng bạn chọn.

> **Lưu ý runtime config:** khi chạy bằng Nitro server, các giá trị `public` được nạp lúc chạy từ biến môi trường. Nếu bạn build ra bản tĩnh (`nuxt generate`) thì biến phải có **ngay lúc build**, và các route `server/api` sẽ không có.

### 15.3. Triển khai Firebase rules và index
```bash
firebase deploy --only firestore:rules,firestore:indexes
```
Thêm domain triển khai vào **Authorized domains** của Firebase Authentication, nếu không đăng nhập Google sẽ lỗi.

### 15.4. Kịch bản demo (3–5 phút)
1. **Vấn đề (30s):** học sinh chỉ biết điểm tổng, không biết yếu chuyên đề nào.
2. **Đăng nhập và làm câu (60s):** làm 2–3 câu, rating chuyên đề đổi trực tiếp, câu "vừa sức" kế tiếp được gợi ý.
3. **AI (45s):** cố tình chọn sai, bấm "Vì sao mình sai?".
4. **Contest (90s):** 2–3 thiết bị cùng thi, bảng xếp hạng nhảy hạng realtime.
5. **Giáo viên/tác động (30s):** (nếu có) dashboard chuyên đề yếu của lớp; nói về học sinh vùng khó khăn, giải đấu giữa các lớp/trường.
6. **So sánh (30s):** 1 slide: "Các nền tảng hiện có xoay quanh cả bộ đề; chúng tôi xoay quanh từng câu + rating theo chuyên đề + contest có rating."

**Luôn chuẩn bị:** video quay sẵn bản demo chạy, dữ liệu đã seed, tài khoản test đã đăng nhập sẵn, mạng dự phòng (điểm phát 4G).

### 15.5. Checklist trước ngày nộp
- [ ] Link demo mở được từ máy lạ, không cần cấu hình.
- [ ] Không còn khóa bí mật trong repo (kiểm tra `git log`).
- [ ] Đáp án 20 câu bất kỳ đã được người thứ hai kiểm lại.
- [ ] Contest demo đã tạo sẵn với thời gian phù hợp lúc trình bày.
- [ ] Ghi chú "dữ liệu mẫu / AI có thể sai" xuất hiện đúng chỗ.
- [ ] Slide so sánh đối thủ đã dựa trên việc dùng thử thực tế (Thi Tốt, Exam24h, Onluyen, Violympic).

---

## 16. Rủi ro và lỗi hay gặp

| Vấn đề | Cách xử lý |
|---|---|
| Transaction lỗi "reads after writes" | Mọi `tx.get` phải nằm trước mọi `tx.set/update` |
| Thiếu composite index | Bấm link trong thông báo lỗi hoặc khai báo trong `firestore.indexes.json` |
| Đăng nhập Google lỗi trên domain deploy | Thêm domain vào Authorized domains |
| `NUXT_FIREBASE_PRIVATE_KEY` lỗi xuống dòng | Dùng `.replace(/\\n/g, '\n')` như mẫu |
| Công thức LaTeX không hiện | Import `katex/dist/katex.min.css`; escape `\\` trong JSON |
| Đồng hồ máy khách lệch | Dùng `serverNow` để bù và server luôn kiểm hạn nộp |
| Rating "dao động" khi ít dữ liệu | K lớn cho người mới/câu mới, giảm dần (đã có) |
| AI trả sai hoặc lỗi | Nhãn cảnh báo, cache, fallback về lời giải giáo viên |
| Bảng xếp hạng trống vì ít người | Kéo vài lớp dùng thử sớm; dữ liệu bot phải ghi rõ |
| Tốn tiền API | Giới hạn lượt, cache, đặt cảnh báo ngân sách trong Google Cloud |
| Bản quyền nội dung | Chỉ dùng đề minh họa chính thức hoặc tự soạn |

**Lỗi hay gặp riêng với Nuxt:**

| Vấn đề | Cách xử lý |
|---|---|
| Lỗi hydration, `window is not defined`, Firebase Auth lỗi lúc render | Dùng `ssr: false`; plugin Firebase đặt tên `*.client.ts`; code chạm `window`/DOM đặt trong `onMounted` |
| Biến môi trường không nhận | Phải có tiền tố `NUXT_`, tên theo SCREAMING_SNAKE_CASE, và **khai báo khóa tương ứng trong `runtimeConfig`**, nếu không Nuxt bỏ qua |
| Lộ khóa bí mật ra client | Khóa server chỉ đặt ngoài `public`; không đọc `useRuntimeConfig()` bí mật trong code phía app |
| Hàm trong `server/utils` không được nhận | Phải là file nằm trực tiếp trong `server/utils/` và dùng `export`; tránh trùng tên giữa các file |
| `useRuntimeConfig()` ở server báo lỗi khi gọi ở top-level | Gọi trong hàm (như `getAdminApp()` ở trên), không gọi lúc nạp module |
| Trạng thái đăng nhập bị `null` khi mới vào trang | Middleware đợi `ready` trước khi quyết định chuyển hướng (đã có) |
| `v-html` bị XSS | Luôn sanitize bằng DOMPurify (đã có trong `AppMarkdown.vue`) |
| Listener `onSnapshot` bị rò rỉ | Hủy trong `onUnmounted` |
| Route `server/api` trả 404 | Kiểm tra đúng hậu tố method (`.post.ts`, `.get.ts`) và đường dẫn thư mục |
| Dev chạy được nhưng production lỗi | Chạy `npm run build && node .output/server/index.mjs` để thử bản production trước khi deploy |

---

## 17. Backlog sau hackathon

1. **Rating theo hạng contest** (Elo-MMR/Codeforces) thay cho cập nhật từng câu.
2. **IRT (lý thuyết ứng đáp câu hỏi)** để ước lượng độ khó và năng lực chính xác hơn Elo.
3. **Lặp lại ngắt quãng (spaced repetition)** cho sổ tay câu sai.
4. **Tích hợp Google Classroom** để giáo viên giao contest và đồng bộ lớp.
5. **Looker Studio / dashboard** cho nhà trường theo dõi.
6. **Công cụ soạn câu hỏi cho giáo viên** (nhập hàng loạt từ Word/CSV, AI gợi ý biến thể, quy trình duyệt).
7. **Chống gian lận nâng cao** (phát hiện đáp án giống nhau bất thường, theo dõi tab).
8. **Giải đấu liên trường/tỉnh** có bảng xếp hạng riêng.
9. **PWA/offline** cho vùng mạng yếu (Nuxt có module PWA).
10. **SSR cho trang giới thiệu** (SEO) bằng `routeRules`, giữ phần còn lại là SPA.
11. **Mô hình bền vững:** miễn phí cho học sinh, thu phí gói cho trường/trung tâm (quản lý lớp, báo cáo, giải đấu riêng).

---

*Tài liệu là hướng dẫn khởi đầu. Hãy cập nhật theo thực tế dự án và luôn kiểm tra tài liệu chính thức của Nuxt, Firebase và Gemini.*