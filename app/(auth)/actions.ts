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

interface IntrospectResponse {
  exp: number
  iat: number
  auth_time: number
  jti: string
  iss: string
  sub: string
  typ: 'Bearer'
  azp: string
  sid: string
  acr: string
  allowed_origins: string[]
  scope: string
  email_verified: boolean
  preferred_username?: string
  email: string
  client_id: 'dw-ai-chatbot'
  username: string
  token_type: 'Bearer'
  active: boolean
}
/**
 * Keycloak 토큰 인트로스펙션을 통해 토큰 유효성을 검증합니다.
 * @param token 검증할 액세스 토큰
 * @returns 토큰이 유효하면 true, 그렇지 않으면 false
 */
export async function validateTokenWithIntrospect(
  token: string,
): Promise<boolean> {
  try {
    const keycloakUrl = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token/introspect`
    const client_id = process.env.AUTH_KEYCLOAK_ID
    const client_secret = process.env.AUTH_KEYCLOAK_SECRET

    if (!keycloakUrl || !client_id || !client_secret) {
      console.error('❌ Keycloak 설정이 누락되었습니다')
      return false
    }

    const formData = new URLSearchParams()
    formData.append('token', token)
    formData.append('client_id', client_id)
    formData.append('client_secret', client_secret)

    const response = await fetch(keycloakUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      console.error('❌ Keycloak 토큰 검증 실패:', response.status)
      return false
    }

    const data: IntrospectResponse = await response.json()
    return data.active === true
  } catch (error) {
    console.error('❌ 토큰 검증 오류:', error)
    return false
  }
}

/**
 * NextAuth 로그아웃을 수행합니다.
 * @param cookieHeader 현재 요청의 쿠키 헤더
 * @param redirectUrl 로그아웃 후 리다이렉트할 URL
 * @returns 로그아웃 성공 여부
 */
export async function performLogout(
  cookieHeader: string,
  redirectUrl = '/login',
): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const csrfUrl = `${baseUrl}/api/auth/csrf`

    // CSRF 토큰 요청
    const csrfResponse = await fetch(csrfUrl, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
      },
    })

    if (!csrfResponse.ok) {
      throw new Error(
        `CSRF token fetch failed with status: ${csrfResponse.status}`,
      )
    }

    const csrfData = await csrfResponse.json()
    const csrfToken = csrfData.csrfToken

    // /api/auth/signout 호출 (CSRF 토큰 포함)
    const logoutUrl = `${baseUrl}/api/auth/signout`

    const logoutResponse = await fetch(logoutUrl, {
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `callbackUrl=${encodeURIComponent(redirectUrl)}&csrfToken=${encodeURIComponent(csrfToken)}`,
    })

    if (logoutResponse.ok) {
      console.log('✅ 로그아웃 API 호출 성공')
      return true
    } else {
      throw new Error(
        ` Logout API failed with status: ${logoutResponse.status}`,
      )
    }
  } catch (error) {
    console.error('❌ 로그아웃 API 호출 실패:', error)
    return false
  }
}
