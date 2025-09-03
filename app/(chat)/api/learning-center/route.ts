import { auth } from '@/app/(auth)/auth'
import {
  saveLearningCenter,
  getAllLearningCenters,
  getLearningCenterById,
  updateLearningCenter,
  deleteLearningCenterById,
} from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import { generateUUID } from '@/lib/utils'
import { postRequestBodySchema, putRequestBodySchema } from './schema'

export async function POST(request: Request) {
  let requestBody: {
    title: string
    description: string
    category: string
    thumbnail: string
    videoId: string
    tags: string[]
  }

  try {
    const json = await request.json()
    requestBody = postRequestBodySchema.parse(json)
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse()
  }

  try {
    const { title, description, category, thumbnail, videoId, tags } =
      requestBody

    const session = await auth()

    if (!session?.user) {
      return new ChatSDKError('unauthorized:auth').toResponse()
    }

    const [learningCenter] = await saveLearningCenter({
      id: generateUUID(),
      title,
      description,
      category,
      thumbnail,
      videoId,
      tags,
      userId: session.user.id,
    })

    return Response.json(learningCenter, { status: 201 })
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    return new ChatSDKError('bad_request:api').toResponse()
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const itemsPerPage = searchParams.get('itemsPerPage')
    const page = searchParams.get('page')
    const search = searchParams.get('search')

    const session = await auth()

    if (!session?.user) {
      return new ChatSDKError('unauthorized:auth').toResponse()
    }

    // 특정 learning center 조회
    if (id) {
      const learningCenter = await getLearningCenterById({ id })

      if (!learningCenter) {
        return new ChatSDKError('not_found:document').toResponse()
      }

      if (learningCenter.userId !== session.user.id) {
        return new ChatSDKError('forbidden:document').toResponse()
      }

      return Response.json(learningCenter, { status: 200 })
    }

    // 페이지네이션 파라미터 처리
    const limit = itemsPerPage ? Number.parseInt(itemsPerPage) : 6
    const currentPage = page ? Number.parseInt(page) : 1
    const offset = (currentPage - 1) * limit

    // 전체 learning center 조회 (페이지네이션 및 검색 적용)
    const { data: learningCenters, totalCount } = await getAllLearningCenters({
      limit,
      offset,
      search: search || undefined,
    })

    // 페이지네이션 메타데이터 계산
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = currentPage < totalPages
    const hasPrevPage = currentPage > 1

    return Response.json(
      {
        data: learningCenters,
        pagination: {
          currentPage,
          totalPages,
          totalCount,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    return new ChatSDKError('bad_request:api').toResponse()
  }
}

export async function PUT(request: Request) {
  let requestBody: {
    title?: string
    description?: string
    category?: string
    thumbnail?: string
    videoId?: string
    tags?: string[]
  }

  try {
    const json = await request.json()
    requestBody = putRequestBodySchema.parse(json)
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new ChatSDKError(
        'bad_request:api',
        'Parameter id is required.',
      ).toResponse()
    }

    const session = await auth()

    if (!session?.user) {
      return new ChatSDKError('unauthorized:auth').toResponse()
    }

    const { title, description, category, thumbnail, videoId, tags } =
      requestBody

    // 기존 learning center 존재 확인
    const existingLearningCenter = await getLearningCenterById({ id })

    if (!existingLearningCenter) {
      return new ChatSDKError('not_found:document').toResponse()
    }

    if (existingLearningCenter.userId !== session.user.id) {
      return new ChatSDKError('forbidden:document').toResponse()
    }

    const [updatedLearningCenter] = await updateLearningCenter({
      id,
      title,
      description,
      category,
      thumbnail,
      videoId,
      tags,
      userId: session.user.id,
    })

    return Response.json(updatedLearningCenter, { status: 200 })
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    return new ChatSDKError('bad_request:api').toResponse()
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return new ChatSDKError(
        'bad_request:api',
        'Parameter id is required.',
      ).toResponse()
    }

    const session = await auth()

    if (!session?.user) {
      return new ChatSDKError('unauthorized:auth').toResponse()
    }

    // 기존 learning center 존재 확인
    const existingLearningCenter = await getLearningCenterById({ id })

    if (!existingLearningCenter) {
      return new ChatSDKError('not_found:document').toResponse()
    }

    if (existingLearningCenter.userId !== session.user.id) {
      return new ChatSDKError('forbidden:document').toResponse()
    }

    const [deletedLearningCenter] = await deleteLearningCenterById({
      id,
      userId: session.user.id,
    })

    return Response.json(deletedLearningCenter, { status: 200 })
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    return new ChatSDKError('bad_request:api').toResponse()
  }
}
