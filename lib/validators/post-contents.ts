import { z } from 'zod'
import { NEWS_LETTER_MESSAGES } from '@/app/(chat)/api/news-letter/schema'

export const postContentsCreateSchema = z.object({
  title: z.string().min(1, NEWS_LETTER_MESSAGES.TITLE_REQUIRED),
  content: z.string().min(1, NEWS_LETTER_MESSAGES.CONTENT_REQUIRED),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  userId: z.string().min(1, '사용자 ID는 필수입니다'),
})

export const postContentsUpdateSchema = z.object({
  title: z.string().min(1, NEWS_LETTER_MESSAGES.TITLE_REQUIRED),
  content: z.string().min(1, NEWS_LETTER_MESSAGES.CONTENT_REQUIRED),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().optional(),
})

export const postContentsQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
  category: z.string().optional(),
})

export function validatePostContentsCreate(data: unknown) {
  return postContentsCreateSchema.safeParse(data)
}

export function validatePostContentsUpdate(data: unknown) {
  return postContentsUpdateSchema.safeParse(data)
}

export function validatePostContentsQuery(data: unknown) {
  return postContentsQuerySchema.safeParse(data)
}
