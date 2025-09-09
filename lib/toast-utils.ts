import { toast } from 'sonner'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { redirect } from 'next/navigation'

/**
 * HTTP 상태 코드별 토스트 메시지를 표시하는 유틸리티 함수
 */
export function showErrorToast(
  statusCode: string | number,
  router?: AppRouterInstance,
  customMessage?: string,
) {
  const code = String(statusCode)

  switch (code) {
    case '400':
      toast.error('잘못된 요청입니다', {
        description: customMessage || '입력 정보를 다시 확인해주세요',
      })
      break

    case '401':
      toast.error('로그인이 만료되었습니다', {
        description: '다시 로그인해주세요',
      })
      if (router) {
        setTimeout(() => redirect('/login'), 2000)
      }
      break

    case '403':
      toast.error('접근 권한이 없습니다', {
        description:
          customMessage || '본인이 작성한 콘텐츠만 수정할 수 있습니다',
      })
      break

    case '404':
      toast.error('요청한 내용을 찾을 수 없습니다', {
        description: customMessage || '삭제되었거나 존재하지 않는 콘텐츠입니다',
      })
      if (router) {
        setTimeout(() => router.back(), 2000)
      }
      break

    case '409':
      toast.error('충돌이 발생했습니다', {
        description:
          customMessage || '다른 사용자가 동시에 수정했을 수 있습니다',
      })
      break

    case '422':
      toast.error('입력 정보를 확인해주세요', {
        description:
          customMessage || '필수 항목을 모두 올바르게 입력했는지 확인해보세요',
      })
      break

    case '429':
      toast.error('요청이 너무 많습니다', {
        description: '잠시 후 다시 시도해주세요',
      })
      break

    case '500':
    case '502':
    case '503':
    case '504':
      toast.error('서버에 일시적인 문제가 발생했습니다', {
        description: '잠시 후 다시 시도해주세요',
      })
      break

    default:
      toast.error('오류가 발생했습니다', {
        description:
          customMessage || '문제가 지속되면 새로고침 후 다시 시도해주세요',
      })
  }
}

/**
 * 네트워크 오류 토스트
 */
export function showNetworkErrorToast() {
  toast.error('인터넷 연결을 확인하고 다시 시도해주세요', {
    description: 'Wi-Fi 또는 데이터 연결 상태를 확인해보세요',
  })
}

/**
 * 일반적인 예상치 못한 오류 토스트
 */
export function showUnexpectedErrorToast(customMessage?: string) {
  toast.error('예상치 못한 오류가 발생했습니다', {
    description: customMessage || '페이지를 새로고침하고 다시 시도해주세요',
  })
}

/**
 * 성공 토스트
 */
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    description,
  })
}

/**
 * API 응답에서 오류를 처리하는 통합 함수
 */
export async function handleApiError(
  response: Response,
  router?: AppRouterInstance,
  context?: {
    notFoundMessage?: string
    forbiddenMessage?: string
    validationMessage?: string
  },
) {
  const statusCode = response.status
  let customMessage: string | undefined

  // 서버에서 보낸 에러 메시지 추출 시도
  try {
    const errorData = await response.json()
    customMessage = errorData.message
  } catch {
    // JSON 파싱 실패 시 무시
  }

  // 컨텍스트별 커스텀 메시지 적용
  if (context) {
    switch (statusCode) {
      case 404:
        customMessage = context.notFoundMessage || customMessage
        break
      case 403:
        customMessage = context.forbiddenMessage || customMessage
        break
      case 422:
        customMessage = context.validationMessage || customMessage
        break
    }
  }

  showErrorToast(statusCode, router, customMessage)
}

/**
 * fetch 요청의 에러를 통합 처리하는 함수
 */
export function handleFetchError(
  error: unknown,
  router?: AppRouterInstance,
  context?: string,
) {
  console.error(`${context || 'API'} 오류:`, error)

  if (error instanceof TypeError && error.message.includes('fetch')) {
    showNetworkErrorToast()
  } else if (
    error instanceof Error &&
    error.message.startsWith('HTTP_ERROR:')
  ) {
    const [, statusCode, message] = error.message.split(':')
    showErrorToast(statusCode, router, message)
  } else {
    showUnexpectedErrorToast()
  }
}
