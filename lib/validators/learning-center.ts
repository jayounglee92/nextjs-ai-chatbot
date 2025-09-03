import {
  LEARNING_CENTER_MESSAGES,
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_CATEGORY_LENGTH,
  MAX_VIDEO_ID_LENGTH,
  MAX_TAGS_COUNT,
  MAX_TAG_LENGTH,
  postRequestBodySchema,
  putRequestBodySchema,
} from '@/app/(chat)/api/learning-center/schema'

export interface ValidationResult {
  success: boolean
  errors?: string[]
  data?: any
}

/**
 * Learning Center 생성 데이터 유효성 검사
 */
export function validateLearningCenterCreate(data: {
  title: string
  description: string
  category: string
  thumbnail: string
  videoId: string
  tags: string[]
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
 * Learning Center 수정 데이터 유효성 검사
 */
export function validateLearningCenterUpdate(data: {
  title?: string
  description?: string
  category?: string
  thumbnail?: string
  videoId?: string
  tags?: string[]
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
export function validateLearningCenterFields(
  title: string,
  description: string,
  category: string,
  thumbnail?: string,
  videoId?: string,
  tags?: string[],
): {
  titleError?: string
  descriptionError?: string
  categoryError?: string
  thumbnailError?: string
  videoIdError?: string
  tagsError?: string
  isValid: boolean
} {
  const titleTrimmed = title.trim()
  const descriptionTrimmed = description.trim()
  const categoryTrimmed = category.trim()
  const videoIdTrimmed = videoId?.trim() || ''

  let titleError: string | undefined
  let descriptionError: string | undefined
  let categoryError: string | undefined
  let thumbnailError: string | undefined
  let videoIdError: string | undefined
  let tagsError: string | undefined

  // 제목 검사
  if (!titleTrimmed) {
    titleError = LEARNING_CENTER_MESSAGES.TITLE_REQUIRED
  } else if (titleTrimmed.length > MAX_TITLE_LENGTH) {
    titleError = LEARNING_CENTER_MESSAGES.TITLE_MAX_LENGTH
  }

  // 설명 검사
  if (!descriptionTrimmed) {
    descriptionError = LEARNING_CENTER_MESSAGES.DESCRIPTION_REQUIRED
  } else if (descriptionTrimmed.length > MAX_DESCRIPTION_LENGTH) {
    descriptionError = LEARNING_CENTER_MESSAGES.DESCRIPTION_MAX_LENGTH
  }

  // 카테고리 검사
  if (!categoryTrimmed) {
    categoryError = LEARNING_CENTER_MESSAGES.CATEGORY_REQUIRED
  } else if (categoryTrimmed.length > MAX_CATEGORY_LENGTH) {
    categoryError = LEARNING_CENTER_MESSAGES.CATEGORY_MAX_LENGTH
  }

  // 썸네일 검사
  if (!thumbnail || !thumbnail.trim()) {
    thumbnailError = LEARNING_CENTER_MESSAGES.THUMBNAIL_REQUIRED
  } else {
    try {
      new URL(thumbnail)
    } catch {
      thumbnailError = LEARNING_CENTER_MESSAGES.THUMBNAIL_VALID
    }
  }

  // 비디오 ID 검사
  if (!videoIdTrimmed) {
    videoIdError = LEARNING_CENTER_MESSAGES.VIDEO_ID_REQUIRED
  } else if (videoIdTrimmed.length > MAX_VIDEO_ID_LENGTH) {
    videoIdError = LEARNING_CENTER_MESSAGES.VIDEO_ID_MAX_LENGTH
  }

  // 태그 검사
  if (tags && tags.length > MAX_TAGS_COUNT) {
    tagsError = LEARNING_CENTER_MESSAGES.TAGS_MAX_COUNT
  } else if (tags) {
    const invalidTag = tags.find((tag) => tag.length > MAX_TAG_LENGTH)
    if (invalidTag) {
      tagsError = LEARNING_CENTER_MESSAGES.TAG_MAX_LENGTH
    }
  }

  return {
    titleError,
    descriptionError,
    categoryError,
    thumbnailError,
    videoIdError,
    tagsError,
    isValid:
      !titleError &&
      !descriptionError &&
      !categoryError &&
      !thumbnailError &&
      !videoIdError &&
      !tagsError,
  }
}
