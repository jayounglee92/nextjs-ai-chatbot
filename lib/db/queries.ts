import 'server-only'

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  stream,
  aiUseCase,
  type AiUseCase,
} from './schema'
import type { ArtifactKind } from '@/components/artifact'
import { generateUUID } from '../utils'
import { generateHashedPassword } from './utils'
import type { VisibilityType } from '@/components/visibility-selector'
import { ChatSDKError } from '../errors'

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!)
const db = drizzle(client)

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email))
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user by email',
    )
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password)

  try {
    return await db.insert(user).values({ email, password: hashedPassword })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user')
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`
  const password = generateHashedPassword(generateUUID())

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    })
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    )
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string
  userId: string
  title: string
  visibility: VisibilityType
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat')
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id))
    await db.delete(message).where(eq(message.chatId, id))
    await db.delete(stream).where(eq(stream.chatId, id))

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning()
    return chatsDeleted
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    )
  }
}

/**
 * 사용자 ID로 채팅 목록을 커서 기반 페이지네이션으로 조회
 *
 * 이 함수의 주요 특징:
 * 1. 커서 기반 페이지네이션으로 효율적인 무한 스크롤 지원
 * 2. createdAt 기준 내림차순 정렬 (최신 채팅이 먼저)
 * 3. hasMore 플래그로 다음 페이지 존재 여부 확인
 * 4. limit + 1로 조회하여 다음 페이지 존재 여부 판단
 *
 * @param id - 사용자 ID
 * @param limit - 반환할 채팅 수
 * @param startingAfter - 이 채팅 ID 이후의 채팅들을 조회 (다음 페이지)
 * @param endingBefore - 이 채팅 ID 이전의 채팅들을 조회 (이전 페이지)
 * @returns 채팅 목록과 hasMore 플래그
 */
export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string
  limit: number
  startingAfter: string | null
  endingBefore: string | null
}) {
  try {
    // 다음 페이지 존재 여부를 확인하기 위해 요청된 limit보다 1개 더 조회
    const extendedLimit = limit + 1

    // 공통 쿼리 빌더 함수
    // whereCondition이 있으면 추가 조건과 userId 조건을 AND로 결합
    // 없으면 userId 조건만 적용
    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id)) // 커서 조건 + 사용자 조건
            : eq(chat.userId, id), // 사용자 조건만
        )
        .orderBy(desc(chat.createdAt)) // 최신 채팅부터 정렬
        .limit(extendedLimit) // limit + 1개 조회

    let filteredChats: Array<Chat> = []

    // 케이스 1: startingAfter가 있는 경우 (다음 페이지 조회)
    if (startingAfter) {
      // 기준점이 되는 채팅을 먼저 조회
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1)

      // 기준 채팅이 존재하지 않으면 에러
      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        )
      }

      // 기준 채팅의 createdAt보다 이후(더 최근)인 채팅들 조회
      // gt = greater than (더 큰, 즉 더 최근)
      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt))
    }
    // 케이스 2: endingBefore가 있는 경우 (이전 페이지 조회)
    else if (endingBefore) {
      // 기준점이 되는 채팅을 먼저 조회
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1)

      // 기준 채팅이 존재하지 않으면 에러
      if (!selectedChat) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        )
      }

      // 기준 채팅의 createdAt보다 이전(더 오래된)인 채팅들 조회
      // lt = less than (더 작은, 즉 더 오래된)
      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt))
    }
    // 케이스 3: 커서가 없는 경우 (첫 페이지 조회)
    else {
      // 사용자의 모든 채팅을 최신순으로 조회
      filteredChats = await query()
    }

    // 다음 페이지가 있는지 확인
    // extendedLimit(limit + 1)개를 조회했으므로,
    // 실제 결과가 limit보다 많으면 다음 페이지가 존재
    const hasMore = filteredChats.length > limit

    return {
      // hasMore가 true면 마지막 1개를 제거하여 정확히 limit개만 반환
      // false면 모든 결과 반환
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore, // 다음 페이지 존재 여부
    }
  } catch (error) {
    // 데이터베이스 오류 발생 시 표준 에러로 변환
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    )
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id))
    return selectedChat
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id')
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>
}) {
  try {
    return await db.insert(message).values(messages)
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages')
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt))
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    )
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string
  messageId: string
  type: 'up' | 'down'
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)))

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)))
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message')
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id))
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    )
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string
  title: string
  kind: ArtifactKind
  content: string
  userId: string
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning()
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document')
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt))

    return documents
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    )
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt))

    return selectedDocument
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    )
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string
  timestamp: Date
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      )

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning()
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    )
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>
}) {
  try {
    return await db.insert(suggestion).values(suggestions)
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save suggestions')
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)))
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    )
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id))
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    )
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string
  timestamp: Date
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)))

    const messageIds = messagesToDelete.map((message) => message.id)

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        )

      return await db
        .delete(message)
        .where(and(eq(message.chatId, chatId), inArray(message.id, messageIds)))
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    )
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string
  visibility: 'private' | 'public'
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId))
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    )
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string
  differenceInHours: number
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    )

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute()

    return stats?.count ?? 0
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    )
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string
  chatId: string
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() })
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create stream id')
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute()

    return streamIds.map(({ id }) => id)
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    )
  }
}

// AI Use Case related functions
export async function saveAiUseCase({
  id,
  title,
  content,
  thumbnailUrl,
  userId,
}: {
  id: string
  title: string
  content: string
  thumbnailUrl?: string
  userId: string
}) {
  try {
    const now = new Date()
    return await db
      .insert(aiUseCase)
      .values({
        id,
        title,
        content,
        thumbnailUrl,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save AI use case')
  }
}

export async function getAiUseCasesByUserId({
  userId,
  limit = 50,
  offset = 0,
}: {
  userId: string
  limit?: number
  offset?: number
}) {
  try {
    return await db
      .select()
      .from(aiUseCase)
      .where(eq(aiUseCase.userId, userId))
      .orderBy(desc(aiUseCase.createdAt))
      .limit(limit)
      .offset(offset)
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get AI use cases by user id',
    )
  }
}

export async function getAiUseCaseById({ id }: { id: string }) {
  try {
    const [selectedAiUseCase] = await db
      .select()
      .from(aiUseCase)
      .where(eq(aiUseCase.id, id))
    return selectedAiUseCase
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get AI use case by id',
    )
  }
}

export async function updateAiUseCase({
  id,
  title,
  content,
  thumbnailUrl,
  userId,
}: {
  id: string
  title?: string
  content?: string
  thumbnailUrl?: string
  userId: string
}) {
  try {
    const updateData: Partial<AiUseCase> = {
      updatedAt: new Date(),
    }

    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl

    return await db
      .update(aiUseCase)
      .set(updateData)
      .where(and(eq(aiUseCase.id, id), eq(aiUseCase.userId, userId)))
      .returning()
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update AI use case',
    )
  }
}

export async function deleteAiUseCaseById({
  id,
  userId,
}: {
  id: string
  userId: string
}) {
  try {
    return await db
      .delete(aiUseCase)
      .where(and(eq(aiUseCase.id, id), eq(aiUseCase.userId, userId)))
      .returning()
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete AI use case',
    )
  }
}
