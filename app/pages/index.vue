<script setup lang="ts">
const { user, loginDemo } = useAuthUser()
const router = useRouter()

const handleQuickStart = () => {
  if (user.value) {
    router.push('/practice')
  } else {
    loginDemo()
    router.push('/practice')
  }
}
</script>

<template>
  <div class="space-y-16 py-8 sm:py-12">
    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-2xs">
        <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
        Giải pháp luyện thi cá nhân hóa thế hệ mới cho kỳ thi tốt nghiệp THPT
      </div>

      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
        Luyện Thi THPT Theo Từng Câu Hỏi
        <br />
        <span class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Biết Chính Xác Mình Mạnh Yếu Ở Đâu
        </span>
      </h1>

      <p class="max-w-3xl mx-auto text-base sm:text-lg text-gray-600 leading-relaxed">
        Không chỉ làm trọn vẹn cả đề thi rồi nhận một con điểm chung chung. AllForOne tính <strong>Rating Elo theo từng chuyên đề</strong>, đề xuất câu hỏi vừa sức và tích hợp <strong>AI Gemini chỉ ra lý do bạn chọn sai</strong>.
      </p>

      <div class="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button
          class="px-6 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-base shadow-md hover:bg-blue-700 hover:shadow-lg transition-all flex items-center gap-2 group"
          @click="handleQuickStart"
        >
          <span>Bắt đầu luyện tập ngay</span>
          <span class="group-hover:translate-x-1 transition-transform">→</span>
        </button>

        <NuxtLink
          to="/contests"
          class="px-6 py-3.5 rounded-xl bg-white border border-gray-300 text-gray-800 font-bold text-base shadow-xs hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <span class="text-rose-500">🏆</span>
          <span>Xem Contest tuần này</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 3 Core Pillars -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div class="rounded-2xl border border-gray-200/80 bg-white p-7 shadow-xs hover:shadow-md transition-shadow space-y-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold">
            📈
          </div>
          <h3 class="text-xl font-bold text-gray-900">Rating Elo Từng Chuyên Đề</h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            Mỗi chuyên đề (Đạo hàm, Tích phân, Oxyz, Dao động cơ...) đều có điểm số năng lực riêng. Thuật toán Elo tự động hiệu chỉnh độ khó câu hỏi và đánh giá đúng trình độ của bạn sau mỗi câu làm.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="rounded-2xl border border-gray-200/80 bg-white p-7 shadow-xs hover:shadow-md transition-shadow space-y-4">
          <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl font-bold">
            🤖
          </div>
          <h3 class="text-xl font-bold text-gray-900">AI Gemini Giải Thích Lỗi Sai</h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            Không chỉ đưa ra đáp án đúng. Khi bạn chọn sai, Gemini đóng vai gia sư thân thiện phân tích lỗ hổng tư duy, giải thích vì sao bạn chọn phương án đó và đưa ra mẹo tránh bẫy lần sau.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="rounded-2xl border border-gray-200/80 bg-white p-7 shadow-xs hover:shadow-md transition-shadow space-y-4">
          <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold">
            ⏱️
          </div>
          <h3 class="text-xl font-bold text-gray-900">Đấu Trường Contest Hàng Tuần</h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            Phòng thi trực tuyến với đồng hồ bù lệch chuẩn xác, bảng xếp hạng nhảy điểm realtime và chống gian lận nhiều lớp. Thử sức cạnh tranh công bằng với học sinh toàn quốc.
          </p>
        </div>
      </div>
    </section>

    <!-- Comparison Section -->
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-8 sm:p-10 shadow-xl space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Sự khác biệt của AllForOne so với các nền tảng thông thường
          </h2>
          <p class="text-slate-300 text-sm max-w-2xl mx-auto">
            Học sinh hiện nay mất nhiều giờ giải cả bộ đề 50 câu chỉ để phát hiện mình sai 3 câu ở chuyên đề đã biết từ trước.
          </p>
        </div>

        <div class="grid sm:grid-cols-2 gap-6 pt-4">
          <div class="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
            <div class="text-rose-400 font-bold text-base flex items-center gap-2">
              <span>✕</span> Nền tảng luyện đề cũ
            </div>
            <ul class="text-xs sm:text-sm text-slate-300 space-y-2 list-disc list-inside">
              <li>Làm 50 câu dàn trải tốn 90 phút</li>
              <li>Chỉ nhận được điểm tổng (ví dụ: 7.6 điểm)</li>
              <li>Không biết chính xác chuyên đề nào đang kéo điểm xuống</li>
              <li>Lặp lại các câu quá dễ hoặc bế tắc ở câu quá khó</li>
            </ul>
          </div>

          <div class="rounded-xl bg-blue-500/10 border border-blue-400/30 p-5 space-y-3">
            <div class="text-emerald-400 font-bold text-base flex items-center gap-2">
              <span>✓</span> Giải pháp AllForOne
            </div>
            <ul class="text-xs sm:text-sm text-slate-200 space-y-2 list-disc list-inside">
              <li>Luyện tập tức thì theo từng câu hỏi trọng tâm</li>
              <li>Biểu đồ Radar đo lường Elo theo từng chuyên đề</li>
              <li>Tự động gợi ý câu hỏi tiếp theo <em>vừa sức (+100 Elo)</em></li>
              <li>AI giải thích bẫy tư duy ngay khi bạn chọn nhầm</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

