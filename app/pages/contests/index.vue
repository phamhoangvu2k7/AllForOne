<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api = useApi()
const contests = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const list = await api<any[]>('/api/contests')
    contests.value = list || []
  } catch (err) {
    console.error('Fetch contests error:', err)
  } finally {
    loading.value = false
  }
})

const getStatusBadge = (status: string) => {
  if (status === 'running') return { text: 'Đang Diễn Ra', color: 'bg-rose-100 text-rose-700 border-rose-300' }
  if (status === 'scheduled') return { text: 'Sắp Diễn Ra', color: 'bg-blue-100 text-blue-700 border-blue-300' }
  return { text: 'Đã Kết Thúc', color: 'bg-gray-100 text-gray-600 border-gray-300' }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <div class="border-b border-gray-200 pb-6">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-3">
        <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        Hệ số Elo nhân 1.5x trong tất cả các contest chính thức
      </div>
      <h1 class="text-3xl font-black text-gray-900 tracking-tight">Đấu Trường Contest Hàng Tuần</h1>
      <p class="text-sm text-gray-500 mt-1 max-w-2xl">
        Thử thách bản thân trong môi trường thi đua thực tế. Bảng xếp hạng cập nhật từng giây, đề thi xáo trộn bảo mật và cơ hội bứt phá rating toàn quốc.
      </p>
    </div>

    <div v-if="loading" class="grid md:grid-cols-2 gap-6">
      <div v-for="i in 2" :key="i" class="h-64 rounded-2xl bg-gray-100 animate-pulse" />
    </div>

    <div v-else class="grid md:grid-cols-2 gap-6">
      <div
        v-for="c in contests"
        :key="c.id"
        class="rounded-2xl border border-gray-200/90 bg-white p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span
              :class="[
                'px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider',
                getStatusBadge(c.status).color,
              ]"
            >
              {{ getStatusBadge(c.status).text }}
            </span>

            <span class="text-xs font-semibold text-gray-500">
              ⏱️ {{ c.durationMin }} phút • {{ c.questionCount }} câu
            </span>
          </div>

          <div>
            <h2 class="text-xl font-bold text-gray-900">
              {{ c.title }}
            </h2>
            <p class="text-sm text-gray-600 mt-2 leading-relaxed">
              {{ c.description }}
            </p>
          </div>
        </div>

        <div class="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
          <div class="text-xs text-gray-400">
            Hạn thi: {{ new Date(c.endTime).toLocaleDateString('vi-VN') }}
          </div>

          <NuxtLink
            :to="`/contests/${c.id}`"
            :class="[
              'px-5 py-2.5 rounded-xl font-bold text-sm transition-all',
              c.status === 'running'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
            ]"
          >
            {{ c.status === 'running' ? 'Vào Thi Ngay ➔' : 'Xem Phòng Thi' }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

