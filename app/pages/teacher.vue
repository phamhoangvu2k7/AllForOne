<script setup lang="ts">
const classStats = ref({
  className: 'Lớp 12A1 — Chuyên Toán - Tin',
  school: 'THPT Chuyên Quốc Học Huế',
  studentCount: 38,
  avgElo: 1240,
  weakestTopics: [
    { name: 'Khảo sát hàm số, Đạo hàm & Cực trị', errorRate: '42%', avgScore: '6.4/10', needReview: true },
    { name: 'Nguyên hàm, Tích phân & Ứng dụng', errorRate: '38%', avgScore: '6.8/10', needReview: true },
    { name: 'Phương pháp tọa độ Oxyz', errorRate: '24%', avgScore: '7.9/10', needReview: false },
    { name: 'Dao động cơ học (Vật lý 12)', errorRate: '19%', avgScore: '8.3/10', needReview: false },
  ],
  recentContests: [
    { title: 'Contest Toán tuần 42', participants: 36, avgScore: 280, topStudent: 'Nguyễn Trần Quang' },
    { title: 'Contest Toán tuần 41', participants: 35, avgScore: 260, topStudent: 'Lê Hoàng Long' },
  ],
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
          <span>👨‍🏫</span> Dành cho Giáo Viên & Nhà Trường (P1)
        </div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">Thống Kê Năng Lực Lớp Học</h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ classStats.className }} • {{ classStats.school }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs">
          + Giao Contest Cho Lớp
        </button>
      </div>
    </div>

    <!-- Summary Metrics -->
    <div class="grid sm:grid-cols-3 gap-5">
      <div class="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs">
        <div class="text-xs font-bold text-gray-400 uppercase">Sĩ số học sinh</div>
        <div class="text-3xl font-black text-gray-900 mt-1">{{ classStats.studentCount }} em</div>
        <p class="text-xs text-emerald-600 font-semibold mt-1">100% học sinh đã kích hoạt tài khoản</p>
      </div>

      <div class="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs">
        <div class="text-xs font-bold text-gray-400 uppercase">Điểm Elo Trung Bình</div>
        <div class="text-3xl font-black text-blue-600 mt-1">{{ classStats.avgElo }}</div>
        <p class="text-xs text-gray-400 mt-1">Tương đương phổ điểm 7.5 - 8.5 THPT</p>
      </div>

      <div class="p-6 rounded-2xl bg-white border border-gray-200 shadow-2xs">
        <div class="text-xs font-bold text-gray-400 uppercase">Chuyên đề cần ôn tập gấp</div>
        <div class="text-3xl font-black text-rose-600 mt-1">2 chuyên đề</div>
        <p class="text-xs text-rose-500 font-semibold mt-1">Tỷ lệ sai vượt mức 35%</p>
      </div>
    </div>

    <!-- Weakest Topics Alert Table -->
    <div class="rounded-2xl bg-white border border-gray-200 p-6 shadow-xs space-y-4">
      <div class="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 class="font-bold text-gray-900 text-base">Phân Tích Chuyên Đề Yếu Nhất Của Học Sinh</h2>
          <p class="text-xs text-gray-500 mt-0.5">Dựa trên dữ liệu làm bài thực tế của cả lớp trong 30 ngày qua</p>
        </div>
        <span class="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">Cảnh báo đỏ</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-3">Chuyên đề kiến thức</th>
              <th class="px-4 py-3 text-center">Tỷ lệ sai</th>
              <th class="px-4 py-3 text-center">Điểm ước lượng</th>
              <th class="px-4 py-3 text-right">Khuyến nghị giảng dạy</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="t in classStats.weakestTopics" :key="t.name" class="hover:bg-gray-50/50">
              <td class="px-4 py-3.5 font-bold text-gray-900">{{ t.name }}</td>
              <td class="px-4 py-3.5 text-center font-extrabold" :class="t.needReview ? 'text-rose-600' : 'text-emerald-600'">
                {{ t.errorRate }}
              </td>
              <td class="px-4 py-3.5 text-center text-gray-600 font-medium">{{ t.avgScore }}</td>
              <td class="px-4 py-3.5 text-right">
                <span
                  v-if="t.needReview"
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700"
                >
                  ⚠️ Cần giảng lại lý thuyết
                </span>
                <span v-else class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  ✓ Nắm vững căn bản
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

