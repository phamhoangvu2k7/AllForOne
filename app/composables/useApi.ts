export function useApi() {
  const { $auth } = useNuxtApp()
  const { user } = useAuthUser()

  return async function api<T>(url: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    let token = ''
    if ($auth && $auth.currentUser) {
      try {
        token = await $auth.currentUser.getIdToken()
      } catch (err) {
        console.warn('Failed to get Firebase token:', err)
      }
    } else if (user.value) {
      if (typeof user.value.getIdToken === 'function') {
        token = await user.value.getIdToken()
      } else if (user.value.uid) {
        token = `demo-token:${user.value.uid}:${encodeURIComponent(user.value.displayName || 'Nguyễn Văn A')}`
      }
    }

    return $fetch<T>(url, {
      ...opts,
      headers: {
        ...(opts?.headers as Record<string, string> | undefined),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  }
}

