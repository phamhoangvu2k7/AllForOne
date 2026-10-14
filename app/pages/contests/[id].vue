<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const api = useApi()
const { user } = useAuthUser()

const contestId = computed(() => route.params.id as string)
const contestInfo = ref<any>(null)
const questions = ref<any[]>([])
const currentIndex = ref(0)
const answers = ref<Record<string, string>>({})
const submitted = ref<Record<string, boolean>>({})
const loading = ref(true)
const submitting = ref(false)
const errorMsg = ref('')

// Countdown sync
const deadlineMs = ref(0)
const clockOffsetMs = ref(0)
const { left, formatted } = useCountdown(deadlineMs, clockOffsetMs)

const currentQuestion = computed(() => questions.value[currentIndex.value])

// Seeded shuffle for current question choices
const shuffledChoices = computed(() => {
  if (!currentQuestion.value?.choices) return []
  const seed = `${user.value?.uid || 'guest'}:${currentQuestion.value.id}`
  return seededShuffle(currentQuestion.value.choices, seed)
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await api<any>(`/api/contests/${contestId.value}/join`, {
      method: 'POST',
    })

    clockOffsetMs.value = res.serverNow - Date.now()
    deadlineMs.value = Math.min(res.endTime, res.startedAt + res.durationMin * 60_000)
    questions.value = res.questions || []

    const detail = await api<any>(`/api/contests/${contestId.value}`)
    contestInfo.value = detail
  } catch (err: any) {
    errorMsg.value = err?.data?.statusMessage || 'Không thể tham gia contest này lúc này.'
  } finally {
    loading.value = false
  }
})

const submitCurrentQuestion = async () => {
  const q = currentQuestion.value
  const ans = answers.value[q.id]
  if (!ans || submitting.value || submitted.value[q.id]) return

  submitting.value = true
  try {
    await api('/api/attempts', {
      method: 'POST',
      body: {
        questionId: q.id,
        answer: ans,
        contestId: contestId.value,
        timeMs: 30000,
      },
    })
    submitted.value[q.id] = true
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Có lỗi khi nộp bài contest.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <!-- Header with Countdown Timer -->
    <div class="rounded-2xl bg-slate-900 text-white p-5 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <NuxtLink to="/contests" class="text-xs text-blue-400 hover:underline">← Trở về danh sách</NuxtLink>
        <h1 class="text-xl sm:text-2xl font-black text-white mt-1">
          {{ contestInfo?.title || 'Phòng Thi Trực Tuyến' }}
        </h1>
        <div class="text-xs text-slate-400 mt-0.5">
          Mỗi câu chỉ được nộp duy nhất 1 lần • Không hiển thị đáp án trước khi hết giờ
        </div>
      </div>

      <!-- Sync Timer Box -->
      <div class="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 self-start md:self-auto">
        <span class="text-xl">⏱️</span>
        <div>
          <div class="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Thời gian còn lại</div>
          <div class="text-xl sm:text-2xl font-black font-mono tracking-tight" :class="left < 300000 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'">
            {{ left <= 0 ? 'HẾT GIỜ' : formatted }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="p-12 text-center text-gray-400 text-sm">
      Đang chuẩn bị đề thi phòng thi...
    </div>

    <div v-else-if="errorMsg" class="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center space-y-3">
      <div class="text-3xl">⚠️</div>
      <div class="text-base font-bold text-rose-800">{{ errorMsg }}</div>
      <NuxtLink to="/contests" class="inline-block mt-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold">
        Quay lại trang Contest
      </NuxtLink>
    </div>

    <div v-else class="grid lg:grid-cols-3 gap-6">
      <!-- Left 2 Cols: Question solving area -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Question Index Navigator -->
        <div class="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 shadow-2xs">
          <span class="text-xs font-bold text-gray-500 mr-2">Danh sách câu:</span>
          <button
            v-for="(q, idx) in questions"
            :key="q.id"
            :class="[
              'w-9 h-9 rounded-lg font-bold text-xs transition-all flex items-center justify-center',
              currentIndex === idx
                ? 'bg-blue-600 text-white shadow-xs'
                : submitted[q.id]
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
            @click="currentIndex = idx"
          >
            {{ idx + 1 }}
          </button>
        </div>

        <!-- Question Card -->
        <div v-if="currentQuestion" class="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div class="flex items-center justify-between border-b border-gray-100 pb-4">
            <span class="font-bold text-gray-900 text-base">Câu {{ currentIndex + 1 }} / {{ questions.length }}</span>
            <span v-if="submitted[currentQuestion.id]" class="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs">
              ✓ Đã nộp câu này
            </span>
            <span v-else class="text-xs text-amber-600 font-semibold">
              Chưa nộp
            </span>
          </div>

          <AppMarkdown :source="currentQuestion.content" />

          <!-- Choices -->
          <div v-if="currentQuestion.type === 'mcq'" class="space-y-3">
            <label
              v-for="c in shuffledChoices"
              :key="c.id"
              :class="[
                'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all',
                answers[currentQuestion.id] === c.id
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-gray-200 hover:bg-gray-50/50',
                submitted[currentQuestion.id] ? 'opacity-70 cursor-not-allowed' : '',
              ]"
            >
              <input
                v-model="answers[currentQuestion.id]"
                type="radio"
                :value="c.id"
                :disabled="submitted[currentQuestion.id] || left <= 0"
                class="mt-1 w-4 h-4 text-blue-600"
              />
              <div class="flex-1">
                <span class="font-bold mr-2">{{ c.id }}.</span>
                <AppMarkdown :source="c.text" class="inline" />
              </div>
            </label>
          </div>

          <!-- Short Answer -->
          <div v-else class="space-y-2">
            <input
              v-model="answers[currentQuestion.id]"
              type="text"
              placeholder="Nhập câu trả lời ngắn..."
              :disabled="submitted[currentQuestion.id] || left <= 0"
              class="w-full text-base rounded-xl border border-gray-300 p-3"
            />
          </div>

          <!-- Submit Action -->
          <div class="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              v-if="!submitted[currentQuestion.id]"
              class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs transition-colors disabled:opacity-50"
              :disabled="!answers[currentQuestion.id] || submitting || left <= 0"
              @click="submitCurrentQuestion"
            >
              {{ submitting ? 'Đang nộp...' : 'Xác nhận nộp câu này' }}
            </button>
            <div v-else class="text-xs text-gray-500 italic">
              Câu này đã được ghi nhận vào bảng xếp hạng. Bạn không thể sửa đổi sau khi đã nộp.
            </div>

            <!-- Next button -->
            <button
              v-if="currentIndex < questions.length - 1"
              class="text-sm font-semibold text-blue-600 hover:underline"
              @click="currentIndex++"
            >
              Câu kế tiếp →
            </button>
          </div>
        </div>
      </div>

      <!-- Right 1 Col: Live Leaderboard -->
      <div class="space-y-4">
        <ContestLeaderboard :contest-id="contestId" />
      </div>
    </div>
  </div>
</template>

