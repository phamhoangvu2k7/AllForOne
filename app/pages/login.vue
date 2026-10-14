<script setup lang="ts">
const { user, loginWithGoogle, loginDemo } = useAuthUser()
const router = useRouter()

const errorMsg = ref('')
const loading = ref(false)

const form = ref({
  displayName: 'Nguyễn Văn A',
  school: 'THPT Chuyên Quốc Học Huế',
  province: 'Thừa Thiên Huế',
  grade: 12,
})

watch(
  user,
  (u) => {
    if (u) {
      router.push('/practice')
    }
  },
  { immediate: true },
)

const handleGoogleLogin = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    await loginWithGoogle()
    router.push('/practice')
  } catch (err: any) {
    errorMsg.value = err.message || 'Đăng nhập Google không thành công. Hãy thử Đăng nhập Demo.'
  } finally {
    loading.value = false
  }
}

const handleDemoLogin = () => {
  loginDemo(form.value.displayName, form.value.school)
  router.push('/practice')
}
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md bg-white rounded-2xl border border-gray-200/80 shadow-md p-8 space-y-6">
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-extrabold text-xl shadow-2xs">
          1
        </div>
        <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Chào Mừng Đến AllForOne</h2>
        <p class="text-xs sm:text-sm text-gray-500">
          Đăng nhập để lưu tiến độ luyện tập và xếp hạng Elo toàn quốc
        </p>
      </div>

      <div v-if="errorMsg" class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
        {{ errorMsg }}
      </div>

      <!-- Google Sign In -->
      <button
        class="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-300 font-semibold text-gray-700 text-sm hover:bg-gray-50 transition-colors shadow-2xs disabled:opacity-60"
        :disabled="loading"
        @click="handleGoogleLogin"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>Đăng nhập với Google</span>
      </button>

      <div class="relative flex items-center justify-center">
        <div class="border-t border-gray-200 w-full"></div>
        <span class="bg-white px-3 text-xs uppercase tracking-wider text-gray-400 font-semibold absolute">
          Hoặc Demo Ngay
        </span>
      </div>

      <!-- Demo Account Quick Sign In -->
      <div class="space-y-4 rounded-xl bg-gray-50/80 p-4 border border-gray-200/60">
        <div class="text-xs text-gray-600 font-medium flex items-center justify-between">
          <span>Thông tin hồ sơ học sinh mẫu:</span>
          <span class="text-emerald-600 font-bold">1 chạm là vào</span>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Họ và tên</label>
            <input
              v-model="form.displayName"
              type="text"
              class="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Trường THPT</label>
            <input
              v-model="form.school"
              type="text"
              class="w-full text-sm rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
          @click="handleDemoLogin"
        >
          <span>🚀 Đăng Nhập Nhanh (Dành cho Giám Khảo/Demo)</span>
        </button>
      </div>

      <div class="text-center text-[11px] text-gray-400 leading-relaxed">
        Bằng việc đăng nhập, bạn đồng ý với mục tiêu bảo mật thông tin tối thiểu và môi trường luyện thi công bằng tại AllForOne.
      </div>
    </div>
  </div>
</template>

