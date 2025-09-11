import { z } from 'zod'

export const MAX_TAGS_COUNT = 6

const POST_MESSAGES = {
  TITLE_REQUIRED: '제목은 필수입니다',
  CONTENT_REQUIRED: '내용은 필수입니다',
  THUMBNAIL_REQUIRED: '썸네일은 필수입니다',
  POST_TYPE_REQUIRED: '포스트 타입은 필수입니다',
  OPEN_TYPE_REQUIRED: '열기 타입은 필수입니다',
}

export const postContentsCreateSchema = z.object({
  title: z.string().min(1, POST_MESSAGES.TITLE_REQUIRED),
  content: z.string().min(1, POST_MESSAGES.CONTENT_REQUIRED),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url(POST_MESSAGES.THUMBNAIL_REQUIRED),
  postType: z.enum(['news', 'aiusecase', 'learningcenter'], {
    message: POST_MESSAGES.POST_TYPE_REQUIRED,
  }),
  openType: z.enum(['page', 'modal', 'new_tab'], {
    message: POST_MESSAGES.OPEN_TYPE_REQUIRED,
  }),
})

export const postContentsUpdateSchema = z.object({
  title: z.string().min(1, POST_MESSAGES.TITLE_REQUIRED),
  content: z.string().min(1, POST_MESSAGES.CONTENT_REQUIRED),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url(POST_MESSAGES.THUMBNAIL_REQUIRED),
  postType: z.enum(['news', 'aiusecase', 'learningcenter'], {
    message: POST_MESSAGES.POST_TYPE_REQUIRED,
  }),
  openType: z.enum(['page', 'modal', 'new_tab'], {
    message: POST_MESSAGES.OPEN_TYPE_REQUIRED,
  }),
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
