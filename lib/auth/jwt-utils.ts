import jwt from 'jsonwebtoken'

/**
 * JWT 토큰 디코딩 유틸리티
 */

interface KeycloakTokenPayload {
  exp: number
  iat: number
  auth_time: number
  jti: string
  iss: string
  aud: string
  sub: string
  typ: string
  azp: string
  sid: string
  acr: string
  'allowed-origins': string[]
  realm_access: {
    roles: string[]
  }
  resource_access: {
    'dw-ai-chatbot': {
      roles: string[]
    }
    account: {
      roles: string[]
    }
  }
  scope: string
  email_verified: boolean
  preferred_username: string
  email: string
}

/**
 * Keycloak 토큰에서 dw-ai-chatbot 클라이언트의 역할을 추출합니다.
 * @param token Keycloak 액세스 토큰
 * @returns 역할 배열 또는 빈 배열
 */
export function extractRolesFromToken(token: string): string[] {
  try {
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded || !decoded.payload) {
      console.error('❌ JWT 토큰 디코딩 실패: 유효하지 않은 토큰')
      return []
    }

    const payload = decoded.payload as KeycloakTokenPayload
    const roles = payload.resource_access?.['dw-ai-chatbot']?.roles || []

    return roles
  } catch (error) {
    console.error('❌ JWT 토큰 디코딩 오류:', error)
    return []
  }
}
