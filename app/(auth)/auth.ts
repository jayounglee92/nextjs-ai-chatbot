import NextAuth, { type DefaultSession } from 'next-auth'
import Keycloak from 'next-auth/providers/keycloak'
import Credentials from 'next-auth/providers/credentials'
import { createGuestUser } from '@/lib/db/queries'
import { authConfig } from './auth.config'
import type { DefaultJWT } from 'next-auth/jwt'

export type UserType = 'guest' | 'regular' | 'keycloak'

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

// Keycloak 설정 디버깅
console.log('🔧 Keycloak 설정 확인:', {
  clientId: process.env.AUTH_KEYCLOAK_ID,
  clientSecret: process.env.AUTH_KEYCLOAK_SECRET ? '✅ 설정됨' : '❌ 없음',
  issuer: process.env.AUTH_KEYCLOAK_ISSUER,
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  debug: false, // Keycloak fetch 오류 로그 숨기기
  providers: [
    // Keycloak 프로바이더 (사내 인증 시스템)
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID || '',
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET || '',
      issuer: process.env.AUTH_KEYCLOAK_ISSUER || '',
      // 디버깅을 위한 로그 추가
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
    // 게스트 프로바이더 (자동 로그인용)
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        console.log('🎭 게스트 사용자 생성 중...')
        const [guestUser] = await createGuestUser()
        console.log('🎭 게스트 사용자 생성 완료:', guestUser)
        return { ...guestUser, type: 'guest' }
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
          console.log('👤 사용자 정보:', {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          })
          console.log('🔑 계정 정보:', account)

          token.id = user.id as string
          token.type = 'keycloak'
        } else if (account?.provider === 'guest') {
          // 게스트 로그인한 경우
          console.log('🎭 게스트 로그인 성공!')
          console.log('👤 게스트 사용자 정보:', {
            id: user.id,
            email: user.email,
            type: user.type,
          })

          token.id = user.id as string
          token.type = 'guest'
        } else {
          // 기존 로직 (Credentials)
          console.log('🔐 Credentials 로그인 성공!')
          console.log('👤 사용자 정보:', user)

          token.id = user.id as string
          token.type = user.type
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.type = token.type

        // 세션 생성 시 로그 출력
        console.log('🎫 세션 생성됨:', {
          user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            type: session.user.type,
          },
          expires: session.expires,
        })
      }

      return session
    },
  },
})
