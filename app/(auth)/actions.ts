'use server'

import { z } from 'zod'

import { createUser, getUser } from '@/lib/db/queries'

import { signIn } from './auth'

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data'
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    })

    return { status: 'success' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' }
    }

    return { status: 'failed' }
  }
}

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data'
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    const [user] = await getUser(validatedData.email)

    if (user) {
      return { status: 'user_exists' } as RegisterActionState
    }
    await createUser(validatedData.email, validatedData.password)
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    })

    return { status: 'success' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' }
    }

    return { status: 'failed' }
  }
}

// Keycloak 사용자 등록을 위한 함수
export const registerKeycloakUser = async (
  userId: string,
  email: string,
): Promise<{ status: 'success' | 'failed' | 'user_exists' }> => {
  try {
    console.log('🔍 registerKeycloakUser 호출:', { userId, email })

    const [user] = await getUser(email)
    console.log('🔍 기존 사용자 조회 결과:', user)

    if (user) {
      console.log('✅ 기존 사용자 발견:', user)
      return { status: 'user_exists' }
    }

    console.log('🆕 새 사용자 생성 시작')
    await createUser(email, undefined, userId) // 이메일, 비밀번호 없음, 특정 사용자 ID
    console.log('✅ 사용자 생성 완료')

    return { status: 'success' }
  } catch (error) {
    console.error('❌ registerKeycloakUser 오류:', error)
    return { status: 'failed' }
  }
}
