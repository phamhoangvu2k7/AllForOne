<script setup lang="ts">
const { user, logout, loginDemo } = useAuthUser()
const router = useRouter()
const api = useApi()
const mobileMenuOpen = ref(false)

const topicsCache = useState<Record<string, any[]>>('topics_cache', () => ({}))
const contestsCache = useState<any[]>('contests_cache', () => [])

const prefetchPractice = () => {
  if (!topicsCache.value.toan) {
    api<any[]>('/api/topics?subject=toan')
      .then((res) => { if (res) topicsCache.value.toan = res })
      .catch(() => {})
  }
}

const prefetchContests = () => {
  if (!contestsCache.value.length) {
    api<any[]>('/api/contests')
      .then((res) => { if (res) contestsCache.value = res })
      .catch(() => {})
  }
}

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="flex items-center gap-2 group">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform">
              1
            </div>
            <div>
              <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                AllForOne
              </span>
              <span class="hidden sm:inline-block ml-1.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                THPT 2026
              </span>
            </div>
          </NuxtLink>

          <!-- Nav Links Desktop -->
          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink
              to="/practice"
              class="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors"
              active-class="text-blue-600 bg-blue-50 font-semibold"
              @mouseenter="prefetchPractice"
            >
              Luyện từng câu
            </NuxtLink>
            <NuxtLink
              to="/contests"
              class="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors flex items-center gap-1.5"
              active-class="text-blue-600 bg-blue-50 font-semibold"
              @mouseenter="prefetchContests"
            >
              Contest tuần
              <span class="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                Live
              </span>
            </NuxtLink>
            <NuxtLink
              to="/profile"
              class="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors"
              active-class="text-blue-600 bg-blue-50 font-semibold"
            >
              Hồ sơ & Radar Elo
            </NuxtLink>
            <NuxtLink
              to="/teacher"
              class="px-3.5 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/60 transition-colors"
              active-class="text-blue-600 bg-blue-50 font-semibold"
            >
              Góc giáo viên
            </NuxtLink>
          </nav>
        </div>

        <!-- Right Side: Auth / User Status -->
        <div class="flex items-center gap-3">
          <template v-if="user">
            <!-- Streak badge -->
            <div class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold shadow-2xs">
              <span>🔥</span>
              <span>{{ user.streak || 1 }} ngày</span>
            </div>

            <!-- User Menu -->
            <div class="flex items-center gap-2">
              <NuxtLink to="/profile" class="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {{ (user.displayName || user.email || 'U')[0] }}
                </div>
                <div class="hidden lg:block text-left text-xs">
                  <div class="font-semibold text-gray-800 leading-tight max-w-[120px] truncate">
                    {{ user.displayName || 'Học sinh' }}
                  </div>
                  <div class="text-[10px] text-gray-400">Lớp 12</div>
                </div>
              </NuxtLink>

              <button
                class="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-gray-50 transition-colors"
                title="Đăng xuất"
                @click="handleLogout"
              >
                Đăng xuất
              </button>
            </div>
          </template>

          <template v-else>
            <button
              class="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              @click="loginDemo()"
            >
              Demo nhanh
            </button>
            <NuxtLink
              to="/login"
              class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors"
            >
              Đăng nhập
            </NuxtLink>
          </template>

          <!-- Mobile Hamburger -->
          <button
            class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Dropdown -->
    <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-1">
      <NuxtLink
        to="/practice"
        class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50"
        @click="mobileMenuOpen = false"
      >
        Luyện từng câu
      </NuxtLink>
      <NuxtLink
        to="/contests"
        class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50"
        @click="mobileMenuOpen = false"
      >
        Contest tuần
      </NuxtLink>
      <NuxtLink
        to="/profile"
        class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50"
        @click="mobileMenuOpen = false"
      >
        Hồ sơ & Radar Elo
      </NuxtLink>
      <NuxtLink
        to="/teacher"
        class="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50"
        @click="mobileMenuOpen = false"
      >
        Góc giáo viên
      </NuxtLink>
    </div>
  </header>
</template>

