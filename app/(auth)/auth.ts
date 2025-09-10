import NextAuth, { type DefaultSession } from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'
import { authConfig } from './auth.config'
import type { DefaultJWT } from 'next-auth/jwt'
import { extractRolesFromToken } from '@/lib/auth'

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

      if (user) {
        if (
          account?.provider === KEYCLOAK_PROVIDER_ID &&
          account.access_token
        ) {
          token.id = user.id as string
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
