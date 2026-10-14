<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    rating?: number
    showRank?: boolean
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    rating: 1000,
    showRank: true,
    size: 'md',
  },
)

const tier = computed(() => {
  const r = props.rating
  if (r >= 1600) return { name: 'Kiện Tướng', color: 'bg-purple-100 text-purple-700 border-purple-300' }
  if (r >= 1400) return { name: 'Vàng', color: 'bg-amber-100 text-amber-700 border-amber-300' }
  if (r >= 1200) return { name: 'Bạc', color: 'bg-slate-100 text-slate-700 border-slate-300' }
  if (r >= 1000) return { name: 'Đồng', color: 'bg-orange-100 text-orange-700 border-orange-300' }
  return { name: 'Tập sự', color: 'bg-gray-100 text-gray-600 border-gray-300' }
})

const sizeClasses = computed(() => {
  if (props.size === 'sm') return 'text-xs px-2 py-0.5'
  if (props.size === 'lg') return 'text-base px-3.5 py-1.5 font-bold'
  return 'text-sm px-2.5 py-1'
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full border font-semibold shadow-xs transition-all',
      tier.color,
      sizeClasses,
    ]"
  >
    <span class="inline-block w-1.5 h-1.5 rounded-full bg-current"></span>
    <span>{{ rating }}</span>
    <span v-if="showRank" class="text-[0.75em] opacity-80 uppercase tracking-wider">
      • {{ tier.name }}
    </span>
  </span>
</template>

