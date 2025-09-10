import NextAuth, { type DefaultSession } from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'
import { authConfig } from './auth.config'
import type { DefaultJWT } from 'next-auth/jwt'
import { extractRolesFromToken } from '@/lib/auth'
import { registerKeycloakUser } from './actions'

export const KEYCLOAK_PROVIDER_ID = 'keycloak'
export type ProviderType = typeof KEYCLOAK_PROVIDER_ID

export const USER_TYPES = {
  AI_ADMIN: 'AI_ADMIN',
  GENERAL: 'GENERAL',
} as const
export type UserTypes = (typeof USER_TYPES)[keyof typeof USER_TYPES]

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      provider: ProviderType
      types: string[]
    } & DefaultSession['user']
  }

  interface User {
    id?: string
    email?: string | null
    provider: ProviderType
    types?: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    provider: ProviderType
    accessToken?: string
    types?: string[]
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    maxAge: 180 * 24 * 60 * 60, // 180일 (세션 유지 기간)
  },
  jwt: {
    maxAge: 72 * 60 * 60, // 72시간뒤 자동 로그아웃됨. 세션이 살아있으면 id, pw 로그인 입력과정 필요없이 바로 로그인됨
  },
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
      profile(profile) {
        // console.log('🔍 Keycloak 프로필 정보 profile:', profile)
        return profile
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      console.log('🔐 Keycloak 로그인 성공!')
      console.log('🔑 토큰 정보 token:', token)
      console.log('🔑 사용자 정보 user:', user)
      console.log('🔑 계정 정보 account:', account)
      console.log('🔑 프로필 정보 profile:', profile)

      if (user) {
        if (
          account?.provider === KEYCLOAK_PROVIDER_ID &&
          account.access_token
        ) {
          // Keycloak 사용자를 데이터베이스에 생성하거나 가져오기
          const keycloakUserId = profile?.preferred_username as string
          const userEmail = user.email || 'unknown@example.com'

          try {
            const result = await registerKeycloakUser(keycloakUserId, userEmail)
            if (result.status === 'success') {
              console.log('👤 데이터베이스 사용자 생성/조회 완료')
            } else if (result.status === 'user_exists') {
              console.log('👤 기존 사용자 발견')
            } else {
              console.error('❌ 사용자 생성/조회 실패')
            }
          } catch (error) {
            console.error('❌ 사용자 생성/조회 실패:', error)
          }

          token.id = keycloakUserId
          token.provider = KEYCLOAK_PROVIDER_ID
          token.accessToken = account.access_token
          token.name = profile?.preferred_username as string
          token.types = extractRolesFromToken(account.access_token)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.provider = token.provider
        session.user.name = token.name
        session.user.types = token.types || []
      }

      return session
    },
  },
})
