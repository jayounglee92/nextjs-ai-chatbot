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
  debug: false, // Keycloak fetch 오류 로그 숨기기
  providers: [
    // Keycloak 프로바이더 (사내 인증 시스템)
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID || '',
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET || '',
      issuer: process.env.AUTH_KEYCLOAK_ISSUER || '',
      profile(profile) {
        console.log('🔍 Keycloak 프로필 정보:', profile)
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          image: profile.picture,
        }
      },
      // 토큰 교환 디버깅
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
      // 클라이언트 설정 디버깅
      client: {
        token_endpoint_auth_method: 'client_secret_basic',
        // 네트워크 타임아웃 설정
        httpOptions: {
          timeout: 10000, // 10초 타임아웃
        },
      },
    }),
    // 기존 Credentials 프로바이더들 (필요시 주석 해제)
    // Credentials({
    //   credentials: {},
    //   async authorize({ email, password }: any) {
    //     const users = await getUser(email);

    //     if (users.length === 0) {
    //       await compare(password, DUMMY_PASSWORD);
    //       return null;
    //     }

    //     const [user] = users;

    //     if (!user.password) {
    //       await compare(password, DUMMY_PASSWORD);
    //       return null;
    //     }

    //     const passwordsMatch = await compare(password, user.password);

    //     if (!passwordsMatch) return null;

    //     return { ...user, type: 'regular' };
    //   },
    // }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Keycloak에서 로그인한 경우
        if (account?.provider === 'keycloak') {
          console.log('🔐 Keycloak 로그인 성공!')
          console.log('👤 사용자 정보 user :', user)
          console.log('🔑 계정 정보 account:', account)
          console.log('🔑 계정 정보 token:', token)

          token.id = user.id as string
          token.type = 'keycloak'
        }
      }

      return token
    },
    async session({ session, token, account }) {
      console.log('🔍 session:', session)

      // Keycloak에서 받은 refresh_expires_in 값을 세션에 반영
      if (token.refresh_expires_at) {
        session.expires = new Date(
          account.refresh_expires_at * 1000,
        ).toISOString()
        console.log(
          '⏰ 세션 만료 시간 (Keycloak 설정):',
          new Date(token.refresh_expires_at * 1000).toLocaleString('ko-KR'),
        )
      }

      if (session.user) {
        session.user.id = token.id
        session.user.type = token.type
      }

      return session
    },
  },
})
