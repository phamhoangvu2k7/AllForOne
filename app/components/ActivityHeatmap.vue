<script setup lang="ts">
const props = defineProps<{
  activity?: Record<string, number>
}>()

// Generate past 84 days (12 weeks)
const days = computed(() => {
  const list: Array<{ date: string; count: number; dayOfWeek: number }> = []
  const today = new Date()

  // Find start date 83 days ago
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000)
    const dateStr = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
    const count = props.activity?.[dateStr] || 0
    list.push({
      date: dateStr,
      count,
      dayOfWeek: d.getDay(), // 0 = Sun, 1 = Mon ...
    })
  }
  return list
})

const getColorClass = (count: number) => {
  if (count === 0) return 'bg-gray-100 hover:bg-gray-200'
  if (count <= 2) return 'bg-emerald-200 hover:bg-emerald-300'
  if (count <= 5) return 'bg-emerald-400 hover:bg-emerald-500'
  if (count <= 10) return 'bg-emerald-600 hover:bg-emerald-700'
  return 'bg-emerald-800 hover:bg-emerald-900'
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-semibold text-gray-800 text-sm">Tần Suất Luyện Tập (12 tuần gần nhất)</h3>
      <div class="flex items-center gap-1.5 text-xs text-gray-400">
        <span>Ít</span>
        <div class="w-2.5 h-2.5 rounded-xs bg-gray-100"></div>
        <div class="w-2.5 h-2.5 rounded-xs bg-emerald-200"></div>
        <div class="w-2.5 h-2.5 rounded-xs bg-emerald-400"></div>
        <div class="w-2.5 h-2.5 rounded-xs bg-emerald-600"></div>
        <div class="w-2.5 h-2.5 rounded-xs bg-emerald-800"></div>
        <span>Nhiều</span>
      </div>
    </div>

    <div class="overflow-x-auto pb-1">
      <div class="grid grid-flow-col grid-rows-7 gap-1.5 w-max">
        <div
          v-for="d in days"
          :key="d.date"
          :title="`${d.date}: ${d.count} câu hỏi`"
          :class="[
            'w-3.5 h-3.5 rounded-xs transition-colors cursor-pointer',
            getColorClass(d.count),
          ]"
        />
      </div>
    </div>
  </div>
</template>

