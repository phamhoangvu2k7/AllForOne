export default defineNuxtRouteMiddleware(async () => {
  const { user, ready } = useAuthUser()

  // Chờ Firebase/Auth xác định trạng thái đăng nhập lần đầu
  if (!ready.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(ready, (v) => {
        if (v) {
          stop()
          resolve()
        }
      })
    })
  }

  if (!user.value) {
    return navigateTo('/login')
  }
})

