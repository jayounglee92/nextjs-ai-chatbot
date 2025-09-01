import type { AiUseCase } from '@/lib/db/schema'
import { generateUUID } from '@/lib/utils'
import { expect, test } from '../fixtures'
import { getMessageByErrorCode } from '@/lib/errors'

const aiUseCasesCreatedByAda: Array<AiUseCase> = []

test.describe
  .serial('/api/ai-use-case', () => {
    test('빈 요청 본문으로 AI 활용사례를 생성할 수 없다', async ({
      adaContext,
    }) => {
      const response = await adaContext.request.post('/api/ai-use-case', {
        data: JSON.stringify({}),
      })
      expect(response.status()).toBe(400)

      const { code, message } = await response.json()
      expect(code).toEqual('bad_request:api')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('제목 없이 AI 활용사례를 생성할 수 없다', async ({ adaContext }) => {
      const response = await adaContext.request.post('/api/ai-use-case', {
        data: {
          content: 'AI 활용사례 내용입니다.',
        },
      })
      expect(response.status()).toBe(400)

      const { code, message } = await response.json()
      expect(code).toEqual('bad_request:api')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('내용 없이 AI 활용사례를 생성할 수 없다', async ({ adaContext }) => {
      const response = await adaContext.request.post('/api/ai-use-case', {
        data: {
          title: 'AI 활용사례 제목',
        },
      })
      expect(response.status()).toBe(400)

      const { code, message } = await response.json()
      expect(code).toEqual('bad_request:api')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('Ada가 AI 활용사례를 생성할 수 있다', async ({ adaContext }) => {
      const draftAiUseCase = {
        title: 'Ada의 AI 활용사례',
        content: '테스트 목적으로 Ada가 생성한 AI 활용사례입니다.',
      }

      const response = await adaContext.request.post('/api/ai-use-case', {
        data: draftAiUseCase,
      })
      expect(response.status()).toBe(201)

      const createdAiUseCase = await response.json()
      expect(createdAiUseCase).toMatchObject(draftAiUseCase)
      expect(createdAiUseCase.id).toBeDefined()
      expect(createdAiUseCase.userId).toBeDefined()
      expect(createdAiUseCase.createdAt).toBeDefined()
      expect(createdAiUseCase.updatedAt).toBeDefined()

      aiUseCasesCreatedByAda.push(createdAiUseCase)
    })

    test('Ada가 자신의 AI 활용사례 목록을 조회할 수 있다', async ({
      adaContext,
    }) => {
      const response = await adaContext.request.get('/api/ai-use-case')
      expect(response.status()).toBe(200)

      const aiUseCases = await response.json()
      expect(aiUseCases).toHaveLength(1)

      const [retrievedAiUseCase] = aiUseCases
      const [createdAiUseCase] = aiUseCasesCreatedByAda
      expect(retrievedAiUseCase).toMatchObject(createdAiUseCase)
    })

    test('존재하지 않는 AI 활용사례를 조회할 수 없다', async ({
      adaContext,
    }) => {
      const nonExistentId = generateUUID()

      const response = await adaContext.request.get(
        `/api/ai-use-case?id=${nonExistentId}`,
      )
      expect(response.status()).toBe(404)

      const { code, message } = await response.json()
      expect(code).toEqual('not_found:ai_use_case')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('Ada가 특정 AI 활용사례를 조회할 수 있다', async ({ adaContext }) => {
      const [createdAiUseCase] = aiUseCasesCreatedByAda

      const response = await adaContext.request.get(
        `/api/ai-use-case?id=${createdAiUseCase.id}`,
      )
      expect(response.status()).toBe(200)

      const retrievedAiUseCase = await response.json()
      expect(retrievedAiUseCase).toMatchObject(createdAiUseCase)
    })

    test('ID 없이 AI 활용사례를 수정할 수 없다', async ({ adaContext }) => {
      const response = await adaContext.request.put('/api/ai-use-case', {
        data: {
          title: '수정된 제목',
        },
      })
      expect(response.status()).toBe(400)

      const { code, message } = await response.json()
      expect(code).toEqual('bad_request:api')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('존재하지 않는 AI 활용사례를 수정할 수 없다', async ({
      adaContext,
    }) => {
      const nonExistentId = generateUUID()

      const response = await adaContext.request.put(
        `/api/ai-use-case?id=${nonExistentId}`,
        {
          data: {
            title: '수정된 제목',
          },
        },
      )
      expect(response.status()).toBe(404)

      const { code, message } = await response.json()
      expect(code).toEqual('not_found:ai_use_case')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('Ada가 자신의 AI 활용사례를 수정할 수 있다', async ({
      adaContext,
    }) => {
      const [createdAiUseCase] = aiUseCasesCreatedByAda

      const updatedData = {
        title: 'Ada의 수정된 AI 활용사례',
        content: '수정된 AI 활용사례 내용입니다.',
      }

      const response = await adaContext.request.put(
        `/api/ai-use-case?id=${createdAiUseCase.id}`,
        {
          data: updatedData,
        },
      )
      expect(response.status()).toBe(200)

      const updatedAiUseCase = await response.json()
      expect(updatedAiUseCase).toMatchObject(updatedData)
      expect(updatedAiUseCase.id).toEqual(createdAiUseCase.id)
      expect(updatedAiUseCase.userId).toEqual(createdAiUseCase.userId)
      expect(updatedAiUseCase.createdAt).toEqual(createdAiUseCase.createdAt)
      expect(new Date(updatedAiUseCase.updatedAt).getTime()).toBeGreaterThan(
        new Date(createdAiUseCase.updatedAt).getTime(),
      )

      // 향후 테스트를 위해 저장된 참조 업데이트
      aiUseCasesCreatedByAda[0] = updatedAiUseCase
    })

    test('Ada가 AI 활용사례를 부분적으로 수정할 수 있다 (제목만)', async ({
      adaContext,
    }) => {
      const [currentAiUseCase] = aiUseCasesCreatedByAda

      const partialUpdate = {
        title: 'Ada의 부분 수정된 AI 활용사례',
      }

      const response = await adaContext.request.put(
        `/api/ai-use-case?id=${currentAiUseCase.id}`,
        {
          data: partialUpdate,
        },
      )
      expect(response.status()).toBe(200)

      const updatedAiUseCase = await response.json()
      expect(updatedAiUseCase.title).toEqual(partialUpdate.title)
      expect(updatedAiUseCase.content).toEqual(currentAiUseCase.content) // 변경되지 않아야 함

      // 향후 테스트를 위해 저장된 참조 업데이트
      aiUseCasesCreatedByAda[0] = updatedAiUseCase
    })

    test('Babbage가 Ada의 AI 활용사례를 조회할 수 없다', async ({
      babbageContext,
    }) => {
      const [adaAiUseCase] = aiUseCasesCreatedByAda

      const response = await babbageContext.request.get(
        `/api/ai-use-case?id=${adaAiUseCase.id}`,
      )
      expect(response.status()).toBe(403)

      const { code, message } = await response.json()
      expect(code).toEqual('forbidden:ai_use_case')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('Babbage가 Ada의 AI 활용사례를 수정할 수 없다', async ({
      babbageContext,
    }) => {
      const [adaAiUseCase] = aiUseCasesCreatedByAda

      const response = await babbageContext.request.put(
        `/api/ai-use-case?id=${adaAiUseCase.id}`,
        {
          data: {
            title: 'Babbage의 수정 시도',
          },
        },
      )
      expect(response.status()).toBe(403)

      const { code, message } = await response.json()
      expect(code).toEqual('forbidden:ai_use_case')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('Babbage가 Ada의 AI 활용사례를 삭제할 수 없다', async ({
      babbageContext,
    }) => {
      const [adaAiUseCase] = aiUseCasesCreatedByAda

      const response = await babbageContext.request.delete(
        `/api/ai-use-case?id=${adaAiUseCase.id}`,
      )
      expect(response.status()).toBe(403)

      const { code, message } = await response.json()
      expect(code).toEqual('forbidden:ai_use_case')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('ID 없이 AI 활용사례를 삭제할 수 없다', async ({ adaContext }) => {
      const response = await adaContext.request.delete('/api/ai-use-case')
      expect(response.status()).toBe(400)

      const { code, message } = await response.json()
      expect(code).toEqual('bad_request:api')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('존재하지 않는 AI 활용사례를 삭제할 수 없다', async ({
      adaContext,
    }) => {
      const nonExistentId = generateUUID()

      const response = await adaContext.request.delete(
        `/api/ai-use-case?id=${nonExistentId}`,
      )
      expect(response.status()).toBe(404)

      const { code, message } = await response.json()
      expect(code).toEqual('not_found:ai_use_case')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('Ada가 자신의 AI 활용사례를 삭제할 수 있다', async ({
      adaContext,
    }) => {
      const [aiUseCaseToDelete] = aiUseCasesCreatedByAda

      const response = await adaContext.request.delete(
        `/api/ai-use-case?id=${aiUseCaseToDelete.id}`,
      )
      expect(response.status()).toBe(200)

      const deletedAiUseCase = await response.json()
      expect(deletedAiUseCase).toMatchObject(aiUseCaseToDelete)
    })

    test('삭제된 AI 활용사례를 조회할 수 없다', async ({ adaContext }) => {
      const [deletedAiUseCase] = aiUseCasesCreatedByAda

      const response = await adaContext.request.get(
        `/api/ai-use-case?id=${deletedAiUseCase.id}`,
      )
      expect(response.status()).toBe(404)

      const { code, message } = await response.json()
      expect(code).toEqual('not_found:ai_use_case')
      expect(message).toEqual(getMessageByErrorCode(code))
    })

    test('삭제 후 Ada의 AI 활용사례가 없다', async ({ adaContext }) => {
      const response = await adaContext.request.get('/api/ai-use-case')
      expect(response.status()).toBe(200)

      const aiUseCases = await response.json()
      expect(aiUseCases).toHaveLength(0)
    })
  })
