# AllForOne — Nền tảng Luyện thi THPT theo Năng lực Thực tế

Nền tảng luyện thi THPT theo **từng câu hỏi**, đánh giá **Rating Elo theo từng chuyên đề**, **đấu trường Contest hằng tuần**, **lời giải cộng đồng** và **AI Gemini giải thích bẫy tư duy**.

---

## 🚀 Khởi chạy dự án (Local)

1. **Cài đặt thư viện:**
   ```bash
   pnpm install
   ```

2. **Chạy máy chủ phát triển:**
   ```bash
   pnpm dev
   ```
   Truy cập: `http://localhost:3000`

3. **Chạy Unit Test:**
   ```bash
   npx vitest run
   ```

---

## 🌐 Triển khai lên Vercel (Zero-Config)

Nuxt 4 và Nitro tự động nhận diện môi trường **Vercel**:

1. Đẩy mã nguồn lên GitHub/GitLab.
2. Vào [Vercel Dashboard](https://vercel.com) $\to$ **Add New Project** $\to$ Import repository.
3. Framework Preset: **Nuxt** (Vercel tự động nhận diện).
4. **Cấu hình Environment Variables (nếu dùng Firebase & Gemini thật):**
   - `NUXT_FIREBASE_PROJECT_ID`
   - `NUXT_FIREBASE_CLIENT_EMAIL`
   - `NUXT_FIREBASE_PRIVATE_KEY`
   - `NUXT_GEMINI_API_KEY`
   - `NUXT_GEMINI_MODEL` (`gemini-2.5-flash`)
   - `NUXT_PUBLIC_FIREBASE_API_KEY`
   - `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NUXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NUXT_PUBLIC_FIREBASE_APP_ID`
   *(Tham khảo mẫu tại `.env.example`. Nếu chưa cấu hình biến môi trường, hệ thống vẫn tự động hoạt động ở chế độ Demo/Mock Store phục vụ chấm thi hackathon).*
5. Bấm **Deploy**.
