import { z } from 'zod'

export const MAX_TITLE_LENGTH = 200
export const MAX_DESCRIPTION_LENGTH = 1000
export const MAX_CATEGORY_LENGTH = 50
export const MAX_VIDEO_ID_LENGTH = 50
export const MAX_TAGS_COUNT = 6
export const MAX_TAG_LENGTH = 30

export const LEARNING_CENTER_MESSAGES = {
  TITLE_REQUIRED: '제목은 필수입니다.',
  TITLE_MAX_LENGTH: `제목은 ${MAX_TITLE_LENGTH}자를 초과할 수 없습니다.`,
  DESCRIPTION_REQUIRED: '설명은 필수입니다.',
  DESCRIPTION_MAX_LENGTH: `설명은 ${MAX_DESCRIPTION_LENGTH}자를 초과할 수 없습니다.`,
  CATEGORY_REQUIRED: '카테고리는 필수입니다.',
  CATEGORY_MAX_LENGTH: `카테고리는 ${MAX_CATEGORY_LENGTH}자를 초과할 수 없습니다.`,
  THUMBNAIL_REQUIRED: '썸네일은 필수입니다.',
  THUMBNAIL_VALID: '올바른 이미지 URL을 입력해주세요.',
  VIDEO_ID_REQUIRED: '비디오 ID는 필수입니다.',
  VIDEO_ID_MAX_LENGTH: `비디오 ID는 ${MAX_VIDEO_ID_LENGTH}자를 초과할 수 없습니다.`,
  TAGS_MAX_COUNT: `태그는 최대 ${MAX_TAGS_COUNT}개까지 입력할 수 있습니다.`,
  TAG_MAX_LENGTH: `각 태그는 ${MAX_TAG_LENGTH}자를 초과할 수 없습니다.`,
}

export const postRequestBodySchema = z.object({
  title: z
    .string()
    .min(1, LEARNING_CENTER_MESSAGES.TITLE_REQUIRED)
    .max(MAX_TITLE_LENGTH, LEARNING_CENTER_MESSAGES.TITLE_MAX_LENGTH),
  description: z
    .string()
    .min(1, LEARNING_CENTER_MESSAGES.DESCRIPTION_REQUIRED)
    .max(
      MAX_DESCRIPTION_LENGTH,
      LEARNING_CENTER_MESSAGES.DESCRIPTION_MAX_LENGTH,
    ),
  category: z
    .string()
    .min(1, LEARNING_CENTER_MESSAGES.CATEGORY_REQUIRED)
    .max(MAX_CATEGORY_LENGTH, LEARNING_CENTER_MESSAGES.CATEGORY_MAX_LENGTH),
  thumbnail: z.string().url(LEARNING_CENTER_MESSAGES.THUMBNAIL_VALID),
  videoId: z
    .string()
    .min(1, LEARNING_CENTER_MESSAGES.VIDEO_ID_REQUIRED)
    .max(MAX_VIDEO_ID_LENGTH, LEARNING_CENTER_MESSAGES.VIDEO_ID_MAX_LENGTH),
  tags: z
    .array(
      z.string().max(MAX_TAG_LENGTH, LEARNING_CENTER_MESSAGES.TAG_MAX_LENGTH),
    )
    .max(MAX_TAGS_COUNT, LEARNING_CENTER_MESSAGES.TAGS_MAX_COUNT)
    .optional()
    .default([]),
})

export type PostRequestBody = z.infer<typeof postRequestBodySchema>

export const putRequestBodySchema = z.object({
  title: z
    .string()
    .min(1, LEARNING_CENTER_MESSAGES.TITLE_REQUIRED)
    .max(MAX_TITLE_LENGTH, LEARNING_CENTER_MESSAGES.TITLE_MAX_LENGTH)
    .optional(),
  description: z
    .string()
    .min(1, LEARNING_CENTER_MESSAGES.DESCRIPTION_REQUIRED)
    .max(
      MAX_DESCRIPTION_LENGTH,
      LEARNING_CENTER_MESSAGES.DESCRIPTION_MAX_LENGTH,
    )
    .optional(),
  category: z
    .string()
    .min(1, LEARNING_CENTER_MESSAGES.CATEGORY_REQUIRED)
    .max(MAX_CATEGORY_LENGTH, LEARNING_CENTER_MESSAGES.CATEGORY_MAX_LENGTH)
    .optional(),
  thumbnail: z
    .string()
    .url(LEARNING_CENTER_MESSAGES.THUMBNAIL_VALID)
    .optional(),
  videoId: z
    .string()
    .min(1, LEARNING_CENTER_MESSAGES.VIDEO_ID_REQUIRED)
    .max(MAX_VIDEO_ID_LENGTH, LEARNING_CENTER_MESSAGES.VIDEO_ID_MAX_LENGTH)
    .optional(),
  tags: z
    .array(
      z.string().max(MAX_TAG_LENGTH, LEARNING_CENTER_MESSAGES.TAG_MAX_LENGTH),
    )
    .max(MAX_TAGS_COUNT, LEARNING_CENTER_MESSAGES.TAGS_MAX_COUNT)
    .optional(),
})

export type PutRequestBody = z.infer<typeof putRequestBodySchema>
