<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api = useApi()
const router = useRouter()

const subject = ref<'toan' | 'ly'>('toan')
const topics = ref<any[]>([])
const loading = ref(true)
const startingTopicId = ref<string | null>(null)

const fetchTopics = async () => {
  loading.value = true
  try {
    const res = await api<any[]>(`/api/topics?subject=${subject.value}`)
    topics.value = res || []
  } catch (err) {
    console.error('Fetch topics error:', err)
  } finally {
    loading.value = false
  }
}

watch(subject, () => {
  fetchTopics()
}, { immediate: true })

const startPractice = async (topicId: string) => {
  startingTopicId.value = topicId
  try {
    const res = await api<any>(`/api/recommend?topicId=${topicId}`)
    if (res?.questions?.length) {
      const targetQuestion = res.questions[0]
      router.push(`/practice/${targetQuestion.id}`)
    } else {
      alert('Chưa có câu hỏi khả dụng cho chuyên đề này!')
    }
  } catch (err: any) {
    console.error('Start practice error:', err)
    alert('Không thể tải câu hỏi. Hãy thử lại!')
  } finally {
    startingTopicId.value = null
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Luyện Tập Theo Chuyên Đề
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Chọn chuyên đề bạn muốn cải thiện. Hệ thống sẽ luôn đề xuất câu hỏi phù hợp nhất với mức Elo hiện tại của bạn.
        </p>
      </div>

      <!-- Subject Tabs -->
      <div class="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200/80 self-start md:self-auto">
        <button
          :class="[
            'px-5 py-2 rounded-lg text-sm font-bold transition-all',
            subject === 'toan'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-gray-600 hover:text-gray-900',
          ]"
          @click="subject = 'toan'"
        >
          📐 Toán Học 12
        </button>
        <button
          :class="[
            'px-5 py-2 rounded-lg text-sm font-bold transition-all',
            subject === 'ly'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-gray-600 hover:text-gray-900',
          ]"
          @click="subject = 'ly'"
        >
          ⚡ Vật Lý 12
        </button>
      </div>
    </div>

    <!-- Topics Grid -->
    <div v-if="loading" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="h-44 rounded-2xl bg-gray-100 animate-pulse" />
    </div>

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="t in topics"
        :key="t.id"
        class="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
      >
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-3xl">{{ t.icon || '📚' }}</span>
            <RatingBadge :rating="t.userRating" />
          </div>

          <div>
            <h3 class="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {{ t.name }}
            </h3>
            <p class="text-xs text-gray-400 mt-1 font-medium">
              {{ t.questionCount }} câu hỏi trong kho đề
            </p>
          </div>
        </div>

        <button
          class="mt-6 w-full py-2.5 px-4 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          :disabled="startingTopicId === t.id"
          @click="startPractice(t.id)"
        >
          <span v-if="startingTopicId === t.id">Đang chọn câu vừa sức...</span>
          <span v-else>Luyện ngay câu vừa sức →</span>
        </button>
      </div>
    </div>
  </div>
</template>

