import type { H3Event } from 'h3'

export interface AuthUser {
  uid: string
  name?: string
  email?: string
}

export async function requireUser(event: H3Event): Promise<AuthUser> {
  const header = getHeader(event, 'authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }

  // Hỗ trợ demo/offline mode khi trình bày hackathon hoặc test offline
  if (token.startsWith('demo-token:')) {
    const parts = token.split(':')
    const uid = parts[1] || 'demo_student_1'
    const name = parts[2] ? decodeURIComponent(parts[2]) : 'Nguyễn Văn A'
    return { uid, name }
  }

  try {
    const d = await getAdminAuth().verifyIdToken(token)
    return { uid: d.uid, name: d.name as string | undefined, email: d.email as string | undefined }
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
  }
}

