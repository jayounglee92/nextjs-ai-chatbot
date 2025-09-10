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
