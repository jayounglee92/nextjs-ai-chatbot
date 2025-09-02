import { z } from 'zod'
import { stripHtmlTags } from '@/lib/utils'

// 상수 정의
export const MAX_TITLE_LENGTH = 200
export const MAX_CONTENT_LENGTH = 10000

export const AI_USE_CASE_MESSAGES = {
  TITLE_REQUIRED: '제목은 필수입니다.',
  TITLE_MAX_LENGTH: `제목은 ${MAX_TITLE_LENGTH}자를 초과할 수 없습니다.`,
  CONTENT_REQUIRED: '내용은 필수입니다.',
  CONTENT_MAX_LENGTH: `내용은 ${MAX_CONTENT_LENGTH}자를 초과할 수 없습니다.`,
  THUMBNAIL_VALID: '올바른 이미지 URL을 입력해주세요.',
}

export const postRequestBodySchema = z.object({
  title: z
    .string()
    .min(1, AI_USE_CASE_MESSAGES.TITLE_REQUIRED)
    .max(200, AI_USE_CASE_MESSAGES.TITLE_MAX_LENGTH),
  content: z
    .string()
    .min(1, AI_USE_CASE_MESSAGES.CONTENT_REQUIRED)
    .refine(
      (content) => {
        const plainText = stripHtmlTags(content)
        return plainText.length <= MAX_CONTENT_LENGTH
      },
      {
        message: AI_USE_CASE_MESSAGES.CONTENT_MAX_LENGTH,
      },
    ),
  thumbnailUrl: z.string().url(AI_USE_CASE_MESSAGES.THUMBNAIL_VALID),
})

export type PostRequestBody = z.infer<typeof postRequestBodySchema>

export const putRequestBodySchema = z.object({
  title: z
    .string()
    .min(1, AI_USE_CASE_MESSAGES.TITLE_REQUIRED)
    .max(200, AI_USE_CASE_MESSAGES.TITLE_MAX_LENGTH)
    .optional(),
  content: z
    .string()
    .min(1, AI_USE_CASE_MESSAGES.CONTENT_REQUIRED)
    .refine(
      (content) => {
        const plainText = stripHtmlTags(content)
        return plainText.length <= MAX_CONTENT_LENGTH
      },
      {
        message: AI_USE_CASE_MESSAGES.CONTENT_MAX_LENGTH,
      },
    )
    .optional(),
  thumbnailUrl: z.string().url(AI_USE_CASE_MESSAGES.THUMBNAIL_VALID),
})

export type PutRequestBody = z.infer<typeof putRequestBodySchema>
