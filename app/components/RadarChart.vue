<script setup lang="ts">
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'vue-chartjs'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const props = defineProps<{
  topics: Array<{
    name: string
    rating: number
  }>
}>()

const chartData = computed(() => {
  return {
    labels: props.topics.map((t) => t.name.length > 18 ? t.name.slice(0, 16) + '...' : t.name),
    datasets: [
      {
        label: 'Rating Năng Lực (Elo)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 0.9)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
        data: props.topics.map((t) => t.rating),
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      min: 600,
      max: 1800,
      ticks: {
        stepSize: 300,
        font: { size: 10 },
      },
      pointLabels: {
        font: { size: 11, weight: 'bold' as const },
        color: '#4b5563',
      },
      grid: {
        color: '#e5e7eb',
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
}
</script>

<template>
  <div class="h-64 sm:h-72 w-full flex items-center justify-center">
    <Radar v-if="topics && topics.length >= 3" :data="chartData" :options="chartOptions" />
    <div v-else class="text-sm text-gray-400 text-center py-12">
      Cần ít nhất 3 chuyên đề có đánh giá để vẽ biểu đồ mạng nhện.
    </div>
  </div>
</template>

