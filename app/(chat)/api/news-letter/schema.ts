import { z } from 'zod'

export const MAX_TITLE_LENGTH = 100
export const MAX_CONTENT_LENGTH = 1000
export const MAX_DESCRIPTION_LENGTH = 200
export const MAX_CATEGORY_LENGTH = 50
export const MAX_VIDEO_ID_LENGTH = 50
export const MAX_TAGS_COUNT = 6
export const MAX_TAG_LENGTH = 10

export const NEWS_LETTER_MESSAGES = {
  TITLE_REQUIRED: '제목은 필수입니다.',
  TITLE_MAX_LENGTH: `제목은 ${MAX_TITLE_LENGTH}자를 초과할 수 없습니다.`,
  CONTENT_REQUIRED: '내용은 필수입니다.',
  CONTENT_MAX_LENGTH: `내용은 ${MAX_CONTENT_LENGTH}자를 초과할 수 없습니다.`,
  THUMBNAIL_REQUIRED: '썸네일은 필수입니다.',
  THUMBNAIL_VALID: '올바른 이미지 URL을 입력해주세요.',
  TAGS_MAX_COUNT: `태그는 최대 ${MAX_TAGS_COUNT}개까지 입력할 수 있습니다.`,
  TAG_MAX_LENGTH: `각 태그는 ${MAX_TAG_LENGTH}자를 초과할 수 없습니다.`,
}

export const postContentsCreateSchema = z.object({
  title: z
    .string()
    .min(1, NEWS_LETTER_MESSAGES.TITLE_REQUIRED)
    .max(MAX_TITLE_LENGTH, NEWS_LETTER_MESSAGES.TITLE_MAX_LENGTH),
  content: z
    .string()
    .min(1, NEWS_LETTER_MESSAGES.CONTENT_REQUIRED)
    .max(MAX_CONTENT_LENGTH, NEWS_LETTER_MESSAGES.CONTENT_MAX_LENGTH),
  category: z.string().optional(),
  postType: z.enum(['aiusecase', 'learningcenter', 'news']),
  tags: z.array(z.string()).optional().default([]),
  thumbnailUrl: z.string().url(NEWS_LETTER_MESSAGES.THUMBNAIL_VALID),
})

export const postContentsUpdateSchema = z.object({
  content: z.string().min(1, '내용은 필수입니다').optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const postContentsQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  search: z.string().optional(),
  category: z.string().optional(),
})
