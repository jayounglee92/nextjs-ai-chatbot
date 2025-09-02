import { z } from 'zod'
import { stripHtmlTags } from '@/lib/utils'
import {
  AI_USE_CASE_MESSAGES,
  MAX_CONTENT_LENGTH,
} from '@/lib/validators/ai-use-case'

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
