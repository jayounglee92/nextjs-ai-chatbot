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
      console.log('✅ Logout API called successfully')
      return true
    } else {
      throw new Error(`Logout API failed with status: ${logoutResponse.status}`)
    }
  } catch (error) {
    console.error('❌ Logout API call failed:', error)
    return false
  }
}
