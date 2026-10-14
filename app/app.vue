<script setup lang="ts">
// Main Layout
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
    <Navbar />

    <main class="flex-1 w-full">
      <NuxtPage />
    </main>

    <footer class="border-t border-gray-200/80 bg-white py-8 mt-12 text-center text-sm text-gray-500">
      <div class="max-w-7xl mx-auto px-4">
        <p class="font-medium text-gray-700">AllForOne — Nền tảng Luyện thi THPT Quốc Gia theo năng lực thực tế</p>
        <p class="text-xs text-gray-400 mt-1">Đánh giá Elo theo từng chuyên đề • AI Gemini giải thích lỗi sai • Đấu trường Contest hàng tuần</p>
      </div>
    </footer>
  </div>
</template>
