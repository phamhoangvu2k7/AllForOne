import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

export function useAuthUser() {
  const { $auth } = useNuxtApp()
  const user = useState<any>('auth-user')
  const ready = useState<boolean>('auth-ready')

  const loginWithGoogle = async () => {
    if (!$auth) {
      throw new Error('Firebase Auth chưa được cấu hình khóa trong .env. Hãy thử tính năng "Đăng nhập nhanh Demo".')
    }
    return await signInWithPopup($auth, new GoogleAuthProvider())
  }

  const loginDemo = (displayName = 'Nguyễn Văn A', school = 'THPT Chuyên Quốc Học Huế') => {
    const demoUser = {
      uid: 'demo_student_1',
      displayName,
      email: 'student@allforone.edu.vn',
      school,
      province: 'Thừa Thiên Huế',
      grade: 12,
      isDemo: true,
      getIdToken: async () => `demo-token:demo_student_1:${encodeURIComponent(displayName)}`,
    }
    user.value = demoUser
    ready.value = true
    try {
      localStorage.setItem('allforone_demo_user', JSON.stringify(demoUser))
    } catch {}
    return demoUser
  }

  const logout = async () => {
    try {
      localStorage.removeItem('allforone_demo_user')
    } catch {}

    if ($auth && $auth.currentUser) {
      await signOut($auth)
    }
    user.value = null
  }

  return {
    user,
    ready,
    login: loginWithGoogle,
    loginWithGoogle,
    loginDemo,
    logout,
  }
}

