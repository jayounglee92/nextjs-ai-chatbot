import { z } from 'zod'

export const postRequestBodySchema = z.object({
  title: z
    .string()
    .min(1, '제목은 필수입니다.')
    .max(200, '제목은 200자를 초과할 수 없습니다.'),
  content: z
    .string()
    .min(1, '내용은 필수입니다.')
    .max(10000, '내용은 10000자를 초과할 수 없습니다.'),
})

export type PostRequestBody = z.infer<typeof postRequestBodySchema>

export const putRequestBodySchema = z.object({
  title: z
    .string()
    .min(1, '제목은 필수입니다.')
    .max(200, '제목은 200자를 초과할 수 없습니다.')
    .optional(),
  content: z
    .string()
    .min(1, '내용은 필수입니다.')
    .max(10000, '내용은 10000자를 초과할 수 없습니다.')
    .optional(),
})

export type PutRequestBody = z.infer<typeof putRequestBodySchema>
