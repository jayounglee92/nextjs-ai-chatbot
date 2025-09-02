import {
  postRequestBodySchema,
  putRequestBodySchema,
} from '@/app/(chat)/api/ai-use-case/schema'
import { stripHtmlTags } from '@/lib/utils'

export const MAX_TITLE_LENGTH = 200
export const MAX_CONTENT_LENGTH = 10000

export const AI_USE_CASE_MESSAGES = {
  TITLE_REQUIRED: '제목은 필수입니다.',
  TITLE_MAX_LENGTH: `제목은 ${MAX_TITLE_LENGTH}자를 초과할 수 없습니다.`,
  CONTENT_REQUIRED: '내용은 필수입니다.',
  CONTENT_MAX_LENGTH: `내용은 ${MAX_CONTENT_LENGTH}자를 초과할 수 없습니다.`,
  THUMBNAIL_REQUIRED: '썸네일 이미지는 필수입니다.',
  THUMBNAIL_VALID: '올바른 이미지 URL을 입력해주세요.',
}

export interface ValidationResult {
  success: boolean
  errors?: string[]
  data?: any
}

/**
 * AI 활용사례 생성 데이터 유효성 검사
 */
export function validateAiUseCaseCreate(data: {
  title: string
  content: string
  thumbnailUrl: string
}): ValidationResult {
  try {
    const validatedData = postRequestBodySchema.parse(data)
    return {
      success: true,
      data: validatedData,
    }
  } catch (error: any) {
    return {
      success: false,
      errors: error.errors?.map((err: any) => err.message) || [
        '유효성 검사 실패',
      ],
    }
  }
}

/**
 * AI 활용사례 수정 데이터 유효성 검사
 */
export function validateAiUseCaseUpdate(data: {
  title?: string
  content?: string
  thumbnailUrl: string
}): ValidationResult {
  try {
    const validatedData = putRequestBodySchema.parse(data)
    return {
      success: true,
      data: validatedData,
    }
  } catch (error: any) {
    return {
      success: false,
      errors: error.errors?.map((err: any) => err.message) || [
        '유효성 검사 실패',
      ],
    }
  }
}

/**
 * 클라이언트용 간단한 유효성 검사 (실시간 피드백용)
 */
export function validateAiUseCaseFields(
  title: string,
  content: string,
  thumbnailUrl?: string,
): {
  titleError?: string
  contentError?: string
  thumbnailError?: string
  isValid: boolean
} {
  const titleTrimmed = title.trim()
  const contentTrimmed = content.trim()

  let titleError: string | undefined
  let contentError: string | undefined
  let thumbnailError: string | undefined

  // 제목 검사
  if (!titleTrimmed) {
    titleError = AI_USE_CASE_MESSAGES.TITLE_REQUIRED
  } else if (titleTrimmed.length > MAX_TITLE_LENGTH) {
    titleError = AI_USE_CASE_MESSAGES.TITLE_MAX_LENGTH
  }

  // 내용 검사 (HTML 태그 제거 후 순수 텍스트 길이 기준)
  if (!contentTrimmed) {
    contentError = AI_USE_CASE_MESSAGES.CONTENT_REQUIRED
  } else {
    const plainText = stripHtmlTags(contentTrimmed)
    if (plainText.length > MAX_CONTENT_LENGTH) {
      contentError = AI_USE_CASE_MESSAGES.CONTENT_MAX_LENGTH
    }
  }

  // 썸네일 검사
  if (!thumbnailUrl || !thumbnailUrl.trim()) {
    thumbnailError = AI_USE_CASE_MESSAGES.THUMBNAIL_REQUIRED
  } else {
    try {
      new URL(thumbnailUrl)
    } catch {
      thumbnailError = AI_USE_CASE_MESSAGES.THUMBNAIL_VALID
    }
  }

  return {
    titleError,
    contentError,
    thumbnailError,
    isValid: !titleError && !contentError && !thumbnailError,
  }
}
