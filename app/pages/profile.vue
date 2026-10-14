<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api = useApi()
const profile = useState<any>('profile_cache', () => null)
const leaderboard = useState<any[]>('leaderboard_cache', () => [])
const currentSubject = ref<'toan' | 'ly'>('toan')
const loading = ref(!profile.value)

const fetchProfile = async () => {
  if (!profile.value) {
    loading.value = true
  }
  try {
    const [p, lb] = await Promise.all([
      api<any>('/api/profile'),
      api<any[]>(`/api/leaderboard?subject=${currentSubject.value}`),
    ])
    if (p) profile.value = p
    if (lb) leaderboard.value = lb
  } catch (err) {
    console.error('Fetch profile error:', err)
  } finally {
    loading.value = false
  }
}

watch(currentSubject, async () => {
  try {
    leaderboard.value = await api<any[]>(`/api/leaderboard?subject=${currentSubject.value}`)
  } catch {}
})

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <div v-if="loading" class="space-y-6">
      <div class="h-44 rounded-2xl bg-gray-100 animate-pulse" />
      <div class="grid md:grid-cols-2 gap-6">
        <div class="h-80 rounded-2xl bg-gray-100 animate-pulse" />
        <div class="h-80 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    </div>

    <template v-else-if="profile">
      <!-- Profile Header Card -->
      <div class="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-md">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black text-white shadow-inner">
              {{ (profile.displayName || 'U')[0] }}
            </div>
            <div>
              <h1 class="text-2xl font-black">{{ profile.displayName }}</h1>
              <p class="text-sm text-blue-100 mt-0.5">
                {{ profile.school }} • Tỉnh {{ profile.province }}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <span class="px-2 py-0.5 rounded-md bg-white/10 text-xs font-semibold">Lớp {{ profile.grade }}</span>
                <span class="px-2 py-0.5 rounded-md bg-amber-400 text-slate-900 text-xs font-bold flex items-center gap-1">
                  <span>🔥</span> Streak {{ profile.streak }} ngày
                </span>
              </div>
            </div>
          </div>

          <!-- Subject Rating Summary -->
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-white/10 backdrop-blur-md p-3.5 text-center min-w-[100px] border border-white/10">
              <div class="text-[10px] uppercase font-bold text-blue-200">Elo Toán</div>
              <div class="text-2xl font-black mt-0.5">{{ profile.ratings?.toan || 1000 }}</div>
            </div>
            <div class="rounded-xl bg-white/10 backdrop-blur-md p-3.5 text-center min-w-[100px] border border-white/10">
              <div class="text-[10px] uppercase font-bold text-blue-200">Elo Vật Lý</div>
              <div class="text-2xl font-black mt-0.5">{{ profile.ratings?.ly || 1000 }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
          <div class="text-xs font-bold text-gray-400 uppercase">Tổng câu đã làm</div>
          <div class="text-2xl font-black text-gray-900 mt-1">{{ profile.stats?.totalAttempts || 0 }} câu</div>
        </div>
        <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs">
          <div class="text-xs font-bold text-gray-400 uppercase">Số câu đúng</div>
          <div class="text-2xl font-black text-emerald-600 mt-1">{{ profile.stats?.totalCorrect || 0 }} câu</div>
        </div>
        <div class="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs col-span-2 sm:col-span-1">
          <div class="text-xs font-bold text-gray-400 uppercase">Tỷ lệ chính xác</div>
          <div class="text-2xl font-black text-blue-600 mt-1">{{ profile.stats?.accuracy || 0 }}%</div>
        </div>
      </div>

      <!-- Visual Charts Row -->
      <div class="grid md:grid-cols-2 gap-8">
        <!-- Radar Chart of Topic Elo -->
        <div class="rounded-2xl bg-white border border-gray-200 p-6 shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 class="font-bold text-gray-800 text-sm">Biểu Đồ Radar Năng Lực Chuyên Đề</h2>
            <span class="text-xs text-blue-600 font-semibold">Toán & Vật lý</span>
          </div>
          <RadarChart :topics="profile.topicRatings || []" />
        </div>

        <!-- 12-Week Activity Heatmap -->
        <div class="space-y-4">
          <ActivityHeatmap :activity="profile.activity" />

          <!-- Rating breakdown table -->
          <div class="rounded-2xl bg-white border border-gray-200 p-5 shadow-xs">
            <h3 class="font-bold text-gray-800 text-sm mb-3">Rating Từng Chuyên Đề</h3>
            <div class="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              <div
                v-for="t in profile.topicRatings"
                :key="t.id"
                class="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-none"
              >
                <span class="font-medium text-gray-700 truncate max-w-[220px]">{{ t.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-[11px] text-gray-400">{{ t.correct }}/{{ t.attempts }} đúng</span>
                  <RatingBadge :rating="t.rating" size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- National Leaderboard -->
      <div class="rounded-2xl bg-white border border-gray-200 p-6 shadow-xs space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 class="font-bold text-gray-900 text-base">Bảng Xếp Hạng Rating Toàn Quốc</h2>
            <p class="text-xs text-gray-500 mt-0.5">Xếp theo điểm Elo môn học</p>
          </div>

          <div class="flex items-center gap-2">
            <button
              :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all', currentSubject === 'toan' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600']"
              @click="currentSubject = 'toan'"
            >
              Môn Toán
            </button>
            <button
              :class="['px-3 py-1.5 rounded-lg text-xs font-bold transition-all', currentSubject === 'ly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600']"
              @click="currentSubject = 'ly'"
            >
              Môn Vật Lý
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th class="px-4 py-2.5 text-center w-12">#</th>
                <th class="px-4 py-2.5">Thí sinh</th>
                <th class="px-4 py-2.5">Trường THPT</th>
                <th class="px-4 py-2.5">Tỉnh / Thành</th>
                <th class="px-4 py-2.5 text-right">Rating Elo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="e in leaderboard" :key="e.id" class="hover:bg-blue-50/30">
                <td class="px-4 py-3 text-center font-bold text-gray-600">{{ e.rank }}</td>
                <td class="px-4 py-3 font-semibold text-gray-900">{{ e.displayName }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ e.school }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ e.province }}</td>
                <td class="px-4 py-3 text-right">
                  <RatingBadge :rating="e.rating" size="sm" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

