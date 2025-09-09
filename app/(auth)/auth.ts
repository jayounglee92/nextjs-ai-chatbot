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
    accessToken?: string
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
        return profile
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'keycloak') {
          token.id = user.id as string
          token.type = 'keycloak'
          token.accessToken = account.access_token
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.type = token.type
      }

      return session
    },
  },
})
