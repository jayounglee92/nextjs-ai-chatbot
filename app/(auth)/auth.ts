import NextAuth, { type DefaultSession } from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'
import { authConfig } from './auth.config'
import type { DefaultJWT } from 'next-auth/jwt'

export type UserType = 'keycloak'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      type: UserType
    } & DefaultSession['user']
  }

  interface User {
    id?: string
    email?: string | null
    type: UserType
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    type: UserType
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
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'keycloak') {
          console.log('🔐 Keycloak 로그인 성공!')
          console.log('👤 사용자 정보 user :', user)
          console.log('ℹ️ 계정 정보 account:', account)
          console.log('🔑 토큰 정보 token:', token)

          token.id = user.id as string
          token.type = 'keycloak'
        }
      }

      return token
    },
    async session({ session, token }) {
      console.log('🔍 세션 정보 session:', session)

      if (session.user) {
        session.user.id = token.id
        session.user.type = token.type
      }

      return session
    },
  },
})
