<script setup lang="ts">
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'

const props = defineProps<{ contestId: string }>()
const { $db } = useNuxtApp()
const rows = ref<any[]>([])
const loading = ref(true)
let unsub: (() => void) | undefined
let pollInterval: any

const fetchViaApi = async () => {
  try {
    const data = await $fetch<any[]>(`/api/contests/${props.contestId}/leaderboard`)
    if (data && data.length) {
      rows.value = data
    }
  } catch (err) {
    console.warn('Leaderboard fetch error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if ($db) {
    try {
      const q = query(
        collection($db, `contests/${props.contestId}/participants`),
        orderBy('score', 'desc'),
        orderBy('lastCorrectAt', 'asc'),
        limit(50),
      )
      unsub = onSnapshot(
        q,
        (snap) => {
          rows.value = snap.docs.map((d, i) => ({
            rank: i + 1,
            id: d.id,
            displayName: d.data().displayName || 'Thí sinh',
            school: d.data().school || '',
            score: d.data().score || 0,
            solved: d.data().solved || 0,
          }))
          loading.value = false
        },
        () => {
          // Fallback to REST polling if firestore snapshot errors
          fetchViaApi()
          pollInterval = setInterval(fetchViaApi, 5000)
        },
      )
      return
    } catch {}
  }

  // Fallback REST polling
  fetchViaApi()
  pollInterval = setInterval(fetchViaApi, 5000)
})

onUnmounted(() => {
  if (unsub) unsub()
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
    <div class="border-b border-gray-100 bg-gray-50/80 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <h3 class="font-semibold text-gray-800 text-sm md:text-base">Bảng Xếp Hạng Trực Tiếp</h3>
      </div>
      <span class="text-xs text-gray-500 font-medium">{{ rows.length }} thí sinh</span>
    </div>

    <div v-if="loading && rows.length === 0" class="p-8 text-center text-gray-400 text-sm">
      Đang tải bảng xếp hạng...
    </div>

    <div v-else-if="rows.length === 0" class="p-8 text-center text-gray-400 text-sm">
      Chưa có thí sinh nào nộp bài. Hãy là người đầu tiên ghi điểm!
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <tr>
            <th class="px-4 py-3 text-center w-12">Hạng</th>
            <th class="px-4 py-3">Học sinh</th>
            <th class="px-4 py-3 hidden sm:table-cell">Trường</th>
            <th class="px-4 py-3 text-center">Đúng</th>
            <th class="px-4 py-3 text-right">Điểm</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="r in rows"
            :key="r.id"
            class="hover:bg-blue-50/40 transition-colors"
          >
            <td class="px-4 py-3 text-center font-bold">
              <span
                v-if="r.rank === 1"
                class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-white text-xs shadow-xs"
              >
                1
              </span>
              <span
                v-else-if="r.rank === 2"
                class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs"
              >
                2
              </span>
              <span
                v-else-if="r.rank === 3"
                class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white text-xs"
              >
                3
              </span>
              <span v-else class="text-gray-500">{{ r.rank }}</span>
            </td>
            <td class="px-4 py-3 font-medium text-gray-900">
              {{ r.displayName }}
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
              {{ r.school || '—' }}
            </td>
            <td class="px-4 py-3 text-center text-gray-700">
              <span class="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-xs">
                {{ r.solved }} câu
              </span>
            </td>
            <td class="px-4 py-3 text-right font-extrabold text-blue-600">
              {{ r.score }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

