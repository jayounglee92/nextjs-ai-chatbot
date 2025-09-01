import { auth } from '@/app/(auth)/auth'
import {
  saveAiUseCase,
  getAiUseCasesByUserId,
  getAiUseCaseById,
  updateAiUseCase,
  deleteAiUseCaseById,
} from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import { generateUUID } from '@/lib/utils'
import { postRequestBodySchema, putRequestBodySchema } from './schema'

export async function POST(request: Request) {
  let requestBody: { title: string; content: string }

  try {
    const json = await request.json()
    requestBody = postRequestBodySchema.parse(json)
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse()
  }

  try {
    const { title, content } = requestBody

    const session = await auth()

    if (!session?.user) {
      return new ChatSDKError('unauthorized:ai_use_case').toResponse()
    }

    const [aiUseCase] = await saveAiUseCase({
      id: generateUUID(),
      title,
      content,
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
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

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

    // 사용자의 모든 AI use case 조회
    const aiUseCases = await getAiUseCasesByUserId({
      userId: session.user.id,
      limit: limit ? Number.parseInt(limit) : undefined,
      offset: offset ? Number.parseInt(offset) : undefined,
    })

    return Response.json(aiUseCases, { status: 200 })
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    return new ChatSDKError('bad_request:ai_use_case').toResponse()
  }
}

export async function PUT(request: Request) {
  let requestBody: { title?: string; content?: string }

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

    const { title, content } = requestBody

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
