import { auth } from '@/app/(auth)/auth'
import {
  saveAiUseCase,
  getAllAiUseCases,
  getAiUseCaseById,
  updateAiUseCase,
  deleteAiUseCaseById,
} from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import { generateUUID } from '@/lib/utils'
import { postRequestBodySchema, putRequestBodySchema } from './schema'
import sanitizeHtml from 'sanitize-html'

export async function POST(request: Request) {
  let requestBody: { title: string; content: string; thumbnailUrl: string }

  try {
    const json = await request.json()
    requestBody = postRequestBodySchema.parse(json)
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse()
  }

  try {
    const { title, content, thumbnailUrl } = requestBody

    const session = await auth()

    if (!session?.user) {
      return new ChatSDKError('unauthorized:ai_use_case').toResponse()
    }

    const [aiUseCase] = await saveAiUseCase({
      id: generateUUID(),
      title,
      content,
      thumbnailUrl,
      userId: session.user.id,
    })

    return Response.json(aiUseCase, { status: 201 })
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    return new ChatSDKError('bad_request:ai_use_case').toResponse()
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
      return new ChatSDKError('unauthorized:ai_use_case').toResponse()
    }

    // 특정 AI use case 조회
    if (id) {
      const aiUseCase = await getAiUseCaseById({ id })

      if (!aiUseCase) {
        return new ChatSDKError('not_found:ai_use_case').toResponse()
      }

      if (aiUseCase.userId !== session.user.id) {
        return new ChatSDKError('forbidden:ai_use_case').toResponse()
      }

      return Response.json(aiUseCase, { status: 200 })
    }

    // 페이지네이션 파라미터 처리
    const limit = itemsPerPage ? Number.parseInt(itemsPerPage) : 6
    const currentPage = page ? Number.parseInt(page) : 1
    const offset = (currentPage - 1) * limit

    // 전체 AI use case 조회 (페이지네이션 및 검색 적용)
    const { data: aiUseCases, totalCount } = await getAllAiUseCases({
      limit,
      offset,
      search: search || undefined,
    })

    // content를 미리 정제하고 요약본 생성
    const processedUseCases = aiUseCases.map((useCase) => {
      const cleanText = sanitizeHtml(useCase.content, {
        allowedTags: [],
        allowedAttributes: {},
      })

      return {
        id: useCase.id,
        title: useCase.title,
        thumbnailUrl: useCase.thumbnailUrl,
        userEmail: useCase.userEmail,
        createdAt: useCase.createdAt,
        cleanText: cleanText,
      }
    })

    // 페이지네이션 메타데이터 계산
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = currentPage < totalPages
    const hasPrevPage = currentPage > 1

    return Response.json(
      {
        data: processedUseCases,
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
    return new ChatSDKError('bad_request:ai_use_case').toResponse()
  }
}

export async function PUT(request: Request) {
  let requestBody: { title?: string; content?: string; thumbnailUrl: string }

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
      return new ChatSDKError('unauthorized:ai_use_case').toResponse()
    }

    const { title, content, thumbnailUrl } = requestBody

    // 기존 AI use case 존재 확인
    const existingAiUseCase = await getAiUseCaseById({ id })

    if (!existingAiUseCase) {
      return new ChatSDKError('not_found:ai_use_case').toResponse()
    }

    if (existingAiUseCase.userId !== session.user.id) {
      return new ChatSDKError('forbidden:ai_use_case').toResponse()
    }

    const [updatedAiUseCase] = await updateAiUseCase({
      id,
      title,
      content,
      thumbnailUrl,
      userId: session.user.id,
    })

    return Response.json(updatedAiUseCase, { status: 200 })
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    return new ChatSDKError('bad_request:ai_use_case').toResponse()
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
      return new ChatSDKError('unauthorized:ai_use_case').toResponse()
    }

    // 기존 AI use case 존재 확인
    const existingAiUseCase = await getAiUseCaseById({ id })

    if (!existingAiUseCase) {
      return new ChatSDKError('not_found:ai_use_case').toResponse()
    }

    if (existingAiUseCase.userId !== session.user.id) {
      return new ChatSDKError('forbidden:ai_use_case').toResponse()
    }

    const [deletedAiUseCase] = await deleteAiUseCaseById({
      id,
      userId: session.user.id,
    })

    return Response.json(deletedAiUseCase, { status: 200 })
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    return new ChatSDKError('bad_request:ai_use_case').toResponse()
  }
}
