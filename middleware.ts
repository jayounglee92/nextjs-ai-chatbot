import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isDevelopmentEnvironment } from './lib/constants'
import {
  validateTokenWithIntrospect,
  performLogout,
} from './app/(auth)/actions'
import { KEYCLOAK_PROVIDER_ID } from './app/(auth)/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 })
  }

  // API 인증 엔드포인트는 통과
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // 로그인 페이지는 통과
  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  })

  // 토큰이 없는 경우 로그인 페이지로 리다이렉트
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Keycloak Access Token (ex. disabled 된 유저는 바로 로그아웃 처리)
  if (token.provider === KEYCLOAK_PROVIDER_ID && token.accessToken) {
    const isActive = await validateTokenWithIntrospect(token.accessToken)
    if (!isActive) {
      console.log(
        '🔒 유저가 비활성(disabled) 상태입니다. 로그아웃을 수행합니다',
      )

      const cookieHeader = request.headers.get('cookie') || ''
      const logoutSuccess = await performLogout(cookieHeader, '/login')

      if (logoutSuccess) {
        return NextResponse.redirect(new URL('/login', request.url))
      } else {
        // fallback: API 호출 실패 시 간단한 리다이렉트
        console.log(
          '⚠️ 대체 방법 사용: API 로그아웃 없이 로그인 페이지로 리다이렉트',
        )
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/api/:path*',
    '/login',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
