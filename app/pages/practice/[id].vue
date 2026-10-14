<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { user } = useAuthUser()
const api = useApi()

const questionId = computed(() => route.params.id as string)

const question = ref<any>(null)
const choice = ref('')
const shortAnswer = ref('')
const result = ref<any>(null)
const ai = ref<any>(null)
const aiLoading = ref(false)
const loading = ref(false)
const startedAt = ref(Date.now())

// Community solutions
const solutions = ref<any[]>([])
const solutionContent = ref('')
const submittingSolution = ref(false)
const votingId = ref<string | null>(null)

const fetchQuestion = async () => {
  loading.value = true
  result.value = null
  ai.value = null
  choice.value = ''
  shortAnswer.value = ''
  startedAt.value = Date.now()

  try {
    const q = await api<any>(`/api/questions/${questionId.value}`)
    question.value = q
    fetchSolutions()
  } catch (err: any) {
    console.error('Fetch question error:', err)
  } finally {
    loading.value = false
  }
}

const fetchSolutions = async () => {
  try {
    const list = await api<any[]>(`/api/solutions?questionId=${questionId.value}`)
    solutions.value = list || []
  } catch (err) {
    console.warn('Fetch solutions error:', err)
  }
}

watch(questionId, () => {
  fetchQuestion()
}, { immediate: true })

// Seeded shuffle choices for fair randomized practice
const choices = computed(() => {
  if (!question.value?.choices) return []
  const seed = `${user.value?.uid || 'guest'}:${question.value.id}`
  return seededShuffle(question.value.choices, seed)
})

const submit = async () => {
  const ans = question.value.type === 'short' ? shortAnswer.value.trim() : choice.value
  if (!ans || loading.value || result.value) return

  loading.value = true
  try {
    const res = await api<any>('/api/attempts', {
      method: 'POST',
      body: {
        questionId: question.value.id,
        answer: ans,
        timeMs: Date.now() - startedAt.value,
      },
    })
    result.value = res
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Có lỗi khi nộp bài. Vui lòng thử lại!')
  } finally {
    loading.value = false
  }
}

const explainWithAi = async () => {
  if (aiLoading.value || ai.value) return
  const ans = question.value.type === 'short' ? shortAnswer.value.trim() : choice.value
  aiLoading.value = true
  try {
    const res = await api<any>('/api/ai/explain', {
      method: 'POST',
      body: {
        questionId: question.value.id,
        answer: ans,
      },
    })
    ai.value = res
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Không thể lấy giải thích AI lúc này.')
  } finally {
    aiLoading.value = false
  }
}

const nextRecommended = async () => {
  if (!question.value?.topicId) return
  try {
    const res = await api<any>(`/api/recommend?topicId=${question.value.topicId}`)
    if (res?.questions?.length) {
      router.push(`/practice/${res.questions[0].id}`)
    } else {
      router.push('/practice')
    }
  } catch {
    router.push('/practice')
  }
}

const postSolution = async () => {
  if (!solutionContent.value.trim() || submittingSolution.value) return
  submittingSolution.value = true
  try {
    await api('/api/solutions', {
      method: 'POST',
      body: {
        questionId: question.value.id,
        content: solutionContent.value,
      },
    })
    solutionContent.value = ''
    await fetchSolutions()
    alert('Đã đăng lời giải thành công!')
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Không thể đăng lời giải. Hãy chắc chắn bạn đã làm câu hỏi này.')
  } finally {
    submittingSolution.value = false
  }
}

const voteSolution = async (id: string) => {
  votingId.value = id
  try {
    const res = await api<any>(`/api/solutions/${id}/vote`, { method: 'POST' })
    const item = solutions.value.find((s) => s.id === id)
    if (item) {
      item.votes = (item.votes || 0) + (res.voted ? 1 : -1)
    }
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Lỗi khi bình chọn lời giải.')
  } finally {
    votingId.value = null
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
    <!-- Breadcrumb & Topic Header -->
    <div class="flex items-center justify-between text-sm">
      <NuxtLink to="/practice" class="text-blue-600 hover:underline flex items-center gap-1 font-medium">
        ← Trở lại danh sách chuyên đề
      </NuxtLink>

      <div v-if="question" class="flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold uppercase">
          Mức {{ question.level }}: {{ question.level === 1 ? 'Nhận biết' : question.level === 2 ? 'Thông hiểu' : question.level === 3 ? 'Vận dụng' : 'Vận dụng cao' }}
        </span>
        <RatingBadge v-if="result" :rating="question.rating" :show-rank="false" size="sm" />
      </div>
    </div>

    <!-- Question Card -->
    <div v-if="question" class="rounded-2xl border border-gray-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      <!-- Question Content -->
      <div class="border-b border-gray-100 pb-5">
        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Câu Hỏi</div>
        <AppMarkdown :source="question.content" />
      </div>

      <!-- Multiple Choice Options -->
      <div v-if="question.type === 'mcq'" class="space-y-3">
        <label
          v-for="c in choices"
          :key="c.id"
          :class="[
            'flex items-start gap-3.5 rounded-xl border p-4 cursor-pointer transition-all',
            choice === c.id
              ? 'border-blue-600 bg-blue-50/50 shadow-xs'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50',
            result && result.correctAnswer?.includes(c.id) ? 'border-emerald-500 bg-emerald-50/60' : '',
            result && !result.correct && choice === c.id ? 'border-rose-400 bg-rose-50/50' : '',
          ]"
        >
          <input
            v-model="choice"
            type="radio"
            :value="c.id"
            :disabled="!!result || loading"
            class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
          />
          <div class="flex-1">
            <span class="font-bold text-gray-900 mr-2">{{ c.id }}.</span>
            <AppMarkdown :source="c.text" class="inline" />
          </div>
        </label>
      </div>

      <!-- Short Answer Input -->
      <div v-else class="space-y-2">
        <label class="block text-xs font-bold text-gray-700 uppercase">Nhập câu trả lời ngắn của bạn</label>
        <input
          v-model="shortAnswer"
          type="text"
          placeholder="Ví dụ: 3.14 hoặc 5..."
          :disabled="!!result || loading"
          class="w-full text-base rounded-xl border border-gray-300 px-4 py-3 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          @keyup.enter="submit"
        />
      </div>

      <!-- Action Button -->
      <div v-if="!result" class="flex items-center justify-between pt-2">
        <button
          class="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
          :disabled="(!choice && !shortAnswer) || loading"
          @click="submit"
        >
          <span v-if="loading">Đang chấm điểm...</span>
          <span v-else>Nộp bài & Chấm Elo</span>
        </button>

        <span class="text-xs text-gray-400">Chấm điểm bảo mật phía server</span>
      </div>

      <!-- Evaluation Result Section -->
      <div v-if="result" class="rounded-xl border p-5 space-y-4 animate-fade-in" :class="result.correct ? 'border-emerald-300 bg-emerald-50/40' : 'border-rose-300 bg-rose-50/40'">
        <!-- Status & Elo Delta -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-2xl">{{ result.correct ? '🎉' : '❌' }}</span>
            <span class="text-lg font-black" :class="result.correct ? 'text-emerald-800' : 'text-rose-800'">
              {{ result.correct ? 'Chính xác!' : 'Chưa chính xác!' }}
            </span>
          </div>

          <div v-if="result.firstTime" class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white shadow-2xs border text-sm font-bold">
            <span class="text-gray-500">Rating Chuyên Đề:</span>
            <span>{{ result.ratingBefore }} → {{ result.ratingAfter }}</span>
            <span :class="result.ratingAfter >= result.ratingBefore ? 'text-emerald-600' : 'text-rose-600'">
              ({{ result.ratingAfter - result.ratingBefore >= 0 ? '+' : '' }}{{ result.ratingAfter - result.ratingBefore }})
            </span>
          </div>
          <div v-else class="text-xs text-gray-500 italic">
            (Đã làm trước đó - Rating không thay đổi)
          </div>
        </div>

        <!-- Teacher's Explanation -->
        <div v-if="result.explanation" class="bg-white rounded-xl p-5 border border-gray-200/80 space-y-2">
          <div class="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>📖</span> Lời Giải Của Giáo Viên
          </div>
          <AppMarkdown :source="result.explanation" />
        </div>

        <!-- AI Explain Trigger Button -->
        <div v-if="!result.correct && !ai" class="pt-2">
          <button
            class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60"
            :disabled="aiLoading"
            @click="explainWithAi"
          >
            <span>🤖</span>
            <span v-if="aiLoading">Gemini AI đang phân tích lỗi sai...</span>
            <span v-else>Vì sao mình sai? (Hỏi AI Gemini)</span>
          </button>
        </div>

        <!-- AI Response Card -->
        <div v-if="ai" class="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 space-y-3">
          <div class="flex items-center justify-between text-xs text-purple-700 font-semibold border-b border-purple-100 pb-2">
            <div class="flex items-center gap-1.5">
              <span>🤖 Gia sư AI Gemini</span>
              <span v-if="ai.cached" class="text-[10px] bg-purple-200/80 px-1.5 py-0.2 rounded-xs">Đã lưu trong bộ nhớ đệm</span>
            </div>
            <span class="text-gray-400 text-[11px] font-normal">
              {{ ai.aiGenerated ? 'AI hỗ trợ phân tích, có thể có sai sót' : 'Lời giải tham chiếu' }}
            </span>
          </div>

          <div v-if="ai.misconception" class="space-y-1">
            <div class="text-xs font-bold text-gray-700">Lỗ hổng khái niệm có thể gặp:</div>
            <p class="text-sm text-gray-800 leading-relaxed">{{ ai.misconception }}</p>
          </div>

          <div class="space-y-1">
            <div class="text-xs font-bold text-gray-700">Giải thích chi tiết:</div>
            <AppMarkdown :source="ai.explanation" />
          </div>

          <div v-if="ai.tip" class="p-3 bg-white/80 rounded-lg border border-purple-200/60 text-sm text-purple-900 flex items-start gap-2">
            <span class="text-base">💡</span>
            <div><strong>Mẹo tránh bẫy:</strong> {{ ai.tip }}</div>
          </div>
        </div>

        <!-- Next Question Button -->
        <div class="pt-4 flex items-center justify-end">
          <button
            class="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
            @click="nextRecommended"
          >
            <span>Luyện câu tiếp theo (vừa sức)</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Community Solutions Section (P1) -->
    <div v-if="question" class="rounded-2xl border border-gray-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      <div class="flex items-center justify-between border-b border-gray-100 pb-4">
        <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>💬</span> Lời Giải Từ Cộng Đồng ({{ solutions.length }})
        </h3>
        <span class="text-xs text-gray-400">Chia sẻ cách giải hay nhận huy hiệu</span>
      </div>

      <!-- Write Solution Form -->
      <div v-if="result" class="space-y-3 bg-gray-50/80 rounded-xl p-4 border border-gray-200/60">
        <label class="block text-xs font-bold text-gray-700">Chia sẻ cách giải độc đáo của bạn (hỗ trợ Markdown & LaTeX):</label>
        <textarea
          v-model="solutionContent"
          rows="3"
          placeholder="Nhập lời giải hoặc cách bấm máy tính Casio..."
          class="w-full text-sm rounded-lg border border-gray-300 p-3 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
        <div class="flex justify-end">
          <button
            class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors disabled:opacity-50"
            :disabled="solutionContent.length < 10 || submittingSolution"
            @click="postSolution"
          >
            {{ submittingSolution ? 'Đang gửi...' : 'Đăng lời giải' }}
          </button>
        </div>
      </div>

      <!-- Solutions List -->
      <div v-if="solutions.length === 0" class="text-center py-6 text-sm text-gray-400">
        Chưa có lời giải cộng đồng nào. Hãy nộp bài và trở thành người đầu tiên chia sẻ lời giải!
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="s in solutions"
          :key="s.id"
          class="rounded-xl border border-gray-200 p-5 space-y-3 bg-white hover:border-gray-300 transition-colors"
        >
          <div class="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-gray-800">{{ s.authorName || 'Học sinh' }}</span>
              <span v-if="s.pinned" class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                ⭐ Lời giải xuất sắc
              </span>
            </div>
            <button
              class="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors"
              :disabled="votingId === s.id"
              @click="voteSolution(s.id)"
            >
              <span>▲ Hữu ích</span>
              <span class="font-bold text-blue-600">{{ s.votes || 0 }}</span>
            </button>
          </div>

          <AppMarkdown :source="s.content" />
        </div>
      </div>
    </div>
  </div>
</template>

