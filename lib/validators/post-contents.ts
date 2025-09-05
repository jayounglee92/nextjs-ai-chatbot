import { z } from 'zod'

const POST_MESSAGES = {
  TITLE_REQUIRED: '제목은 필수입니다',
  CONTENT_REQUIRED: '내용은 필수입니다',
}

export const postContentsCreateSchema = z.object({
  title: z.string().min(1, POST_MESSAGES.TITLE_REQUIRED),
  content: z.string().min(1, POST_MESSAGES.CONTENT_REQUIRED),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().optional(),
  postType: z.enum(['news', 'aiusecase', 'learningcenter']),
})

export const postContentsUpdateSchema = z.object({
  title: z.string().min(1, POST_MESSAGES.TITLE_REQUIRED),
  content: z.string().min(1, POST_MESSAGES.CONTENT_REQUIRED),
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
