export function useCountdown(deadlineMs: Ref<number>, clockOffsetMs: Ref<number>) {
  const left = ref(0)
  let timer: any

  const tick = () => {
    left.value = Math.max(0, deadlineMs.value - (Date.now() + clockOffsetMs.value))
  }

  const formatted = computed(() => {
    const totalSec = Math.floor(left.value / 1000)
    const hours = Math.floor(totalSec / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  onMounted(() => {
    tick()
    timer = setInterval(tick, 500)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return { left, formatted }
}

