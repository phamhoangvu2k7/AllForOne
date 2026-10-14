export default defineNuxtRouteMiddleware(async () => {
  const { user, ready } = useAuthUser()

  // 1) Nếu đã có user từ phiên làm việc trước, cho phép chuyển trang tức thì (0ms trễ)
  if (user.value) {
    return
  }

  // 2) Nếu chưa xác định, chờ tối đa 600ms
  if (!ready.value) {
    await Promise.race([
      new Promise<void>((resolve) => {
        const stop = watch(ready, (v) => {
          if (v) {
            stop()
            resolve()
          }
        })
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 600)),
    ])
  }

  if (!user.value) {
    return navigateTo('/login')
  }
})

