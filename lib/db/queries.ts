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
  ilike,
  or,
  lt,
  type SQL,
  sql,
} from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { calculateReadingTime, generateUUID } from '@/lib/utils'
import sanitizeHtml from 'sanitize-html'

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
  learningCenter,
  type LearningCenter,
  posts,
  type Posts,
  postContents,
  type PostContents,
} from './schema'
import type { ArtifactKind } from '@/components/artifact'
import { generateHashedPassword } from './utils'
import type { VisibilityType } from '@/components/visibility-selector'
import { ChatSDKError } from '../errors'
import type {
  PostContentsWithTagsArray,
  PostContentsWithTagsArrayResponse,
} from '../types'
import type {
  OpenType,
  PostType,
  Visibility,
} from '../validators/post-contents'

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

export async function getUserById(id: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.id, id))
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user by id')
  }
}

export async function createUser(
  email: string,
  password?: string,
  userId?: string,
) {
  const hashedPassword = password ? generateHashedPassword(password) : null

  try {
    // userId가 제공되면 사용, 아니면 자동 생성
    const finalUserId = userId || generateUUID()

    const result = await db.insert(user).values({
      id: finalUserId, // Keycloak username 또는 자동 생성된 ID
      email,
      password: hashedPassword,
      createdAt: new Date(),
    })
    return result
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
    console.error('Database error in getChatById:', error)
    return null
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
    // 데이터와 총 개수를 동시에 조회
    const [data, totalCountResult] = await Promise.all([
      db
        .select()
        .from(aiUseCase)
        .where(eq(aiUseCase.userId, userId))
        .orderBy(desc(aiUseCase.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(aiUseCase)
        .where(eq(aiUseCase.userId, userId)),
    ])

    const totalCount = totalCountResult[0]?.count || 0

    return {
      data,
      totalCount,
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get AI use cases by user id',
    )
  }
}

export async function getAllAiUseCases({
  limit = 50,
  offset = 0,
  search,
}: {
  limit?: number
  offset?: number
  search?: string
}) {
  try {
    let data: Array<AiUseCase & { userEmail: string }>
    let totalCount: number

    const searchTerm = search && search.trim() ? `%${search.trim()}%` : null

    if (searchTerm) {
      // 검색어가 있는 경우: SQL 쿼리에서 직접 검색
      const [dataResult, totalCountResult] = await Promise.all([
        db
          .select({
            id: aiUseCase.id,
            title: aiUseCase.title,
            content: aiUseCase.content,
            thumbnailUrl: aiUseCase.thumbnailUrl,
            userId: aiUseCase.userId,
            createdAt: aiUseCase.createdAt,
            updatedAt: aiUseCase.updatedAt,
            userEmail: user.email,
          })
          .from(aiUseCase)
          .innerJoin(user, eq(aiUseCase.userId, user.id))
          .where(
            or(
              ilike(aiUseCase.title, searchTerm),
              ilike(aiUseCase.content, searchTerm),
            ),
          )
          .orderBy(desc(aiUseCase.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(aiUseCase)
          .innerJoin(user, eq(aiUseCase.userId, user.id))
          .where(
            or(
              ilike(aiUseCase.title, searchTerm),
              ilike(aiUseCase.content, searchTerm),
            ),
          ),
      ])

      data = dataResult
      totalCount = totalCountResult[0]?.count || 0
    } else {
      // 검색어가 없는 경우: 기존 로직 사용
      const [dataResult, totalCountResult] = await Promise.all([
        db
          .select({
            id: aiUseCase.id,
            title: aiUseCase.title,
            content: aiUseCase.content,
            thumbnailUrl: aiUseCase.thumbnailUrl,
            userId: aiUseCase.userId,
            createdAt: aiUseCase.createdAt,
            updatedAt: aiUseCase.updatedAt,
            userEmail: user.email,
          })
          .from(aiUseCase)
          .innerJoin(user, eq(aiUseCase.userId, user.id))
          .orderBy(desc(aiUseCase.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(aiUseCase),
      ])

      data = dataResult
      totalCount = totalCountResult[0]?.count || 0
    }

    return {
      data,
      totalCount,
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get all AI use cases',
    )
  }
}

export async function getAiUseCaseById({ id }: { id: string }) {
  try {
    const [selectedAiUseCase] = await db
      .select()
      .from(aiUseCase)
      .where(eq(aiUseCase.id, id))

    if (!selectedAiUseCase) {
      return null
    }

    // User 정보를 별도로 조회
    const [userInfo] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, selectedAiUseCase.userId))

    return {
      ...selectedAiUseCase,
      userEmail: userInfo?.email || 'Unknown',
    }
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

// Learning Center related functions
export async function saveLearningCenter({
  id,
  title,
  description,
  category,
  thumbnail,
  tags,
  videoId,
  userId,
}: {
  id: string
  title: string
  description: string
  category: string
  thumbnail: string
  tags: string[]
  videoId: string
  userId: string
}) {
  try {
    const now = new Date()
    return await db
      .insert(learningCenter)
      .values({
        id,
        title,
        description,
        category,
        thumbnail,
        tags: tags.join(','),
        videoId,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save learning center',
    )
  }
}

export async function getLearningCentersByUserId({
  userId,
  limit = 50,
  offset = 0,
}: {
  userId: string
  limit?: number
  offset?: number
}) {
  try {
    const [data, totalCountResult] = await Promise.all([
      db
        .select()
        .from(learningCenter)
        .where(eq(learningCenter.userId, userId))
        .orderBy(desc(learningCenter.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(learningCenter)
        .where(eq(learningCenter.userId, userId)),
    ])

    const totalCount = totalCountResult[0]?.count || 0

    return {
      data: data.map((item) => ({
        ...item,
        tags: JSON.parse(item.tags) as string[],
      })),
      totalCount,
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get learning centers by user id',
    )
  }
}

export async function getAllLearningCenters({
  limit = 50,
  offset = 0,
  search,
}: {
  limit?: number
  offset?: number
  search?: string
}) {
  try {
    let data: Array<LearningCenter & { userEmail: string; tags: string[] }>
    let totalCount: number

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`

      const [dataResult, totalCountResult] = await Promise.all([
        db
          .select({
            id: learningCenter.id,
            title: learningCenter.title,
            description: learningCenter.description,
            category: learningCenter.category,
            thumbnail: learningCenter.thumbnail,
            tags: learningCenter.tags,
            videoId: learningCenter.videoId,
            userId: learningCenter.userId,
            createdAt: learningCenter.createdAt,
            updatedAt: learningCenter.updatedAt,
            userEmail: user.email,
          })
          .from(learningCenter)
          .innerJoin(user, eq(learningCenter.userId, user.id))
          .where(
            or(
              ilike(learningCenter.title, searchTerm),
              ilike(learningCenter.description, searchTerm),
              ilike(learningCenter.tags, searchTerm),
            ),
          )
          .orderBy(desc(learningCenter.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: count() })
          .from(learningCenter)
          .innerJoin(user, eq(learningCenter.userId, user.id))
          .where(
            or(
              ilike(learningCenter.title, searchTerm),
              ilike(learningCenter.description, searchTerm),
              ilike(learningCenter.tags, searchTerm),
            ),
          ),
      ])

      data = dataResult.map((item: any) => ({
        ...item,
        tags: (item.tags as string)
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      }))
      totalCount = totalCountResult[0]?.count || 0
    } else {
      const [dataResult, totalCountResult] = await Promise.all([
        db
          .select({
            id: learningCenter.id,
            title: learningCenter.title,
            description: learningCenter.description,
            category: learningCenter.category,
            thumbnail: learningCenter.thumbnail,
            tags: learningCenter.tags,
            videoId: learningCenter.videoId,
            userId: learningCenter.userId,
            createdAt: learningCenter.createdAt,
            updatedAt: learningCenter.updatedAt,
            userEmail: user.email,
          })
          .from(learningCenter)
          .innerJoin(user, eq(learningCenter.userId, user.id))
          .orderBy(desc(learningCenter.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(learningCenter),
      ])

      data = dataResult.map((item: any) => ({
        ...item,
        tags: (item.tags as string)
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      }))
      totalCount = totalCountResult[0]?.count || 0
    }

    return {
      data,
      totalCount,
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get all learning centers',
    )
  }
}

export async function getLearningCenterById({ id }: { id: string }) {
  try {
    const [selectedLearningCenter] = await db
      .select()
      .from(learningCenter)
      .where(eq(learningCenter.id, id))

    if (!selectedLearningCenter) {
      return null
    }

    const [userInfo] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, selectedLearningCenter.userId))

    return {
      ...selectedLearningCenter,
      tags: (selectedLearningCenter.tags as string)
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      userEmail: userInfo?.email || 'Unknown',
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get learning center by id',
    )
  }
}

export async function updateLearningCenter({
  id,
  title,
  description,
  category,
  thumbnail,
  tags,
  videoId,
  userId,
}: {
  id: string
  title?: string
  description?: string
  category?: string
  thumbnail?: string
  tags?: string[]
  videoId?: string
  userId: string
}) {
  try {
    const updateData: Partial<LearningCenter> = {
      updatedAt: new Date(),
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail
    if (tags !== undefined) updateData.tags = tags.join(',')
    if (videoId !== undefined) updateData.videoId = videoId

    return await db
      .update(learningCenter)
      .set(updateData)
      .where(and(eq(learningCenter.id, id), eq(learningCenter.userId, userId)))
      .returning()
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update learning center',
    )
  }
}

export async function deleteLearningCenterById({
  id,
  userId,
}: {
  id: string
  userId: string
}) {
  try {
    return await db
      .delete(learningCenter)
      .where(and(eq(learningCenter.id, id), eq(learningCenter.userId, userId)))
      .returning()
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete learning center',
    )
  }
}

// PostContents related functions
export async function savePostContents({
  id,
  postId,
  content,
  category,
  tags,
  userId,
}: {
  id?: string
  postId: string
  content: string
  category?: string
  tags?: string
  userId: string
}) {
  try {
    const now = new Date()
    const data = {
      postId,
      content,
      category: category || null,
      tags: tags || null,
      userId,
      createdAt: now,
      updatedAt: now,
    }

    if (id) {
      // Update existing postContents
      return await db
        .update(postContents)
        .set({ ...data, updatedAt: now })
        .where(and(eq(postContents.id, id), eq(postContents.userId, userId)))
        .returning()
    } else {
      // Create new postContents
      return await db.insert(postContents).values(data).returning()
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save post contents',
    )
  }
}

export async function getPostContentsByPostId({
  postId,
  limit = 50,
  offset = 0,
}: {
  postId: string
  limit?: number
  offset?: number
}) {
  try {
    const [data, totalCountResult] = await Promise.all([
      db
        .select()
        .from(postContents)
        .where(eq(postContents.postId, postId))
        .orderBy(desc(postContents.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(postContents)
        .where(eq(postContents.postId, postId)),
    ])

    const totalCount = totalCountResult[0]?.count || 0

    return {
      data,
      totalCount,
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get post contents by post id',
    )
  }
}

export async function getAllPostContents({
  limit = 50,
  offset = 0,
  search,
  category,
}: {
  limit?: number
  offset?: number
  search?: string
  category?: string
}): Promise<PostContentsWithTagsArrayResponse> {
  try {
    let data: PostContentsWithTagsArray[]
    let totalCount: number

    const searchTerm = search && search.trim() ? `%${search.trim()}%` : null
    const whereConditions = [eq(posts.visibility, 'public')] // public인 게시물만 조회

    if (searchTerm) {
      whereConditions.push(
        or(
          ilike(postContents.content, searchTerm),
          ilike(postContents.category, searchTerm),
          ilike(postContents.tags, searchTerm),
        ),
      )
    }

    if (category) {
      whereConditions.push(eq(postContents.category, category))
    }

    const finalWhereCondition = and(...whereConditions)

    const [dataResult, totalCountResult] = await Promise.all([
      db
        .select()
        .from(postContents)
        .innerJoin(posts, eq(postContents.postId, posts.id))
        .where(finalWhereCondition)
        .orderBy(desc(postContents.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(postContents)
        .innerJoin(posts, eq(postContents.postId, posts.id))
        .where(finalWhereCondition),
    ])

    // tags를 쉼표로 구분된 문자열에서 배열로 변환
    data = dataResult.map((item) => ({
      ...item.PostContents,
      tags: item.PostContents.tags ? item.PostContents.tags.split(',') : [],
    }))
    totalCount = totalCountResult[0]?.count || 0

    return {
      data,
      totalCount,
    }
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get all post contents',
    )
  }
}

export async function getPostContentsById({ id }: { id: string }) {
  try {
    const [selectedPostContents] = await db
      .select()
      .from(postContents)
      .where(eq(postContents.id, id))

    if (!selectedPostContents) {
      return null
    }

    // tags를 쉼표로 구분된 문자열에서 배열로 변환
    const result = {
      ...selectedPostContents,
      tags: selectedPostContents.tags
        ? selectedPostContents.tags.split(',')
        : [],
    }

    return result
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get post contents by id',
    )
  }
}

export async function updatePostContents({
  id,
  content,
  category,
  tags,
  title,
  thumbnailUrl,
  summary,
  summaryType = 'auto_truncated',
  visibility,
}: {
  id: string
  content?: string
  category?: string
  tags?: string | null
  title?: string
  thumbnailUrl?: string | null
  summary?: string
  summaryType?: 'ai_generated' | 'auto_truncated'
  visibility?: Visibility
}) {
  try {
    // PostContents 업데이트 데이터
    const postContentsUpdateData: Partial<PostContents> = {
      updatedAt: new Date(),
    }

    if (content !== undefined) postContentsUpdateData.content = content
    if (category !== undefined) postContentsUpdateData.category = category
    if (tags !== undefined) postContentsUpdateData.tags = tags

    // PostContents 업데이트
    const updatedPostContents = await db
      .update(postContents)
      .set(postContentsUpdateData)
      .where(eq(postContents.postId, id))
      .returning()

    // Posts 테이블도 업데이트가 필요한 경우
    if (
      title !== undefined ||
      thumbnailUrl !== undefined ||
      content !== undefined ||
      visibility !== undefined
    ) {
      const postContentsRecord = updatedPostContents[0]
      if (postContentsRecord) {
        const postsUpdateData: Partial<Posts> = {
          updatedAt: new Date(),
        }

        if (title !== undefined) postsUpdateData.title = title
        if (thumbnailUrl !== undefined)
          postsUpdateData.thumbnailUrl = thumbnailUrl
        if (visibility !== undefined) postsUpdateData.visibility = visibility

        // content가 변경된 경우 summary도 업데이트
        if (content !== undefined) {
          if (summaryType === 'auto_truncated') {
            postsUpdateData.summary = sanitizeHtml(content, {
              allowedTags: [],
              allowedAttributes: {},
            }).substring(0, 200)
          } else if (summary !== undefined) {
            postsUpdateData.summary = summary
          }
        }

        await db
          .update(posts)
          .set(postsUpdateData)
          .where(eq(posts.id, postContentsRecord.postId))
      }
    }

    return updatedPostContents
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update post contents',
    )
  }
}

export async function deletePostContentsById({ id }: { id: string }) {
  try {
    // 먼저 PostContents를 삭제
    const deletedPostContents = await db
      .delete(postContents)
      .where(eq(postContents.postId, id))
      .returning()

    // PostContents가 삭제되었으면 Posts도 삭제
    if (deletedPostContents && deletedPostContents.length > 0) {
      await db.delete(posts).where(eq(posts.id, id))
    }

    return deletedPostContents
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete post contents',
    )
  }
}

export async function getPostContentsCategories() {
  try {
    const categories = await db
      .selectDistinct({ category: postContents.category })
      .from(postContents)
      .where(eq(postContents.category, postContents.category)) // NULL이 아닌 카테고리만 조회
      .orderBy(asc(postContents.category))

    return categories.map((item) => item.category).filter(Boolean)
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get post contents categories',
    )
  }
}

// Posts related functions
export async function savePost({
  id,
  title,
  summary,
  summaryType = 'auto_truncated',
  thumbnailUrl,
  userId,
  postType,
  visibility = 'private',
  viewCount = 0,
  likeCount = 0,
  openType = 'page',
}: {
  id?: string
  title: string
  summary?: string
  summaryType?: 'ai_generated' | 'auto_truncated'
  thumbnailUrl?: string
  userId: string
  postType: PostType
  visibility?: Visibility
  viewCount?: number
  likeCount?: number
  openType?: OpenType
}) {
  try {
    const now = new Date()
    const data = {
      ...(id && { id }),
      title,
      summary,
      summaryType,
      thumbnailUrl,
      userId,
      postType,
      visibility,
      viewCount,
      likeCount,
      openType,
      createdAt: now,
      updatedAt: now,
    }

    return await db.insert(posts).values(data).returning()
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save post')
  }
}

export async function getAllPosts({
  limit = 50,
  offset = 0,
  search,
  postType,
  visibility,
}: {
  limit?: number
  offset?: number
  search?: string
  postType?: string
  visibility?: string
}) {
  try {
    let data: Array<Posts & { readingTime: number; userEmail: string | null }>
    let totalCount: number

    const searchTerm = search && search.trim() ? `%${search.trim()}%` : null
    const whereConditions = []

    // visibility 파라미터가 없으면 기본값으로 'public' 사용
    const visibilityFilter = visibility || 'public'
    whereConditions.push(eq(posts.visibility, visibilityFilter as Visibility))

    if (searchTerm) {
      whereConditions.push(
        or(ilike(posts.title, searchTerm), ilike(posts.summary, searchTerm)),
      )
    }

    if (postType) {
      whereConditions.push(eq(posts.postType, postType as any))
    }

    const finalWhereCondition = and(...whereConditions)

    const [dataResult, totalCountResult] = await Promise.all([
      db
        .select({
          id: posts.id,
          title: posts.title,
          summary: posts.summary,
          summaryType: posts.summaryType,
          thumbnailUrl: posts.thumbnailUrl,
          userId: posts.userId,
          postType: posts.postType,
          visibility: posts.visibility,
          viewCount: posts.viewCount,
          likeCount: posts.likeCount,
          openType: posts.openType,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          category: postContents.category,
          tags: postContents.tags,
          content: postContents.content,
          userEmail: user.email,
        })
        .from(posts)
        .leftJoin(postContents, eq(posts.id, postContents.postId))
        .leftJoin(user, eq(posts.userId, user.id))
        .where(finalWhereCondition)
        .orderBy(desc(posts.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(posts).where(finalWhereCondition),
    ])

    // tags를 쉼표로 구분된 문자열에서 배열로 변환하고 readingTime 계산
    data = dataResult.map((item) => {
      // content에서 HTML 제거
      const cleanContent = item.content
        ? sanitizeHtml(item.content, { allowedTags: [] })
        : ''
      // readingTime 계산
      const readingTime = calculateReadingTime(cleanContent)

      return {
        ...item,
        tags: item.tags ? item.tags.split(',') : [],
        readingTime,
      }
    })
    totalCount = totalCountResult[0]?.count || 0

    return {
      data,
      totalCount,
    }
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get all posts')
  }
}

export async function updatePost({
  id,
  title,
  summary,
  summaryType,
  thumbnailUrl,
  visibility,
  openType,
}: {
  id: string
  title?: string
  summary?: string
  summaryType?: 'ai_generated' | 'auto_truncated'
  thumbnailUrl?: string
  visibility?: Visibility
  openType?: OpenType
}) {
  try {
    const updateData: Partial<Posts> = {
      updatedAt: new Date(),
    }

    if (title !== undefined) updateData.title = title
    if (summary !== undefined) updateData.summary = summary
    if (summaryType !== undefined) updateData.summaryType = summaryType
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
    if (visibility !== undefined) updateData.visibility = visibility
    if (openType !== undefined) updateData.openType = openType

    return await db
      .update(posts)
      .set(updateData)
      .where(eq(posts.id, id))
      .returning()
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to update post')
  }
}

export async function deletePostById({ id }: { id: string }) {
  try {
    return await db.delete(posts).where(eq(posts.id, id)).returning()
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to delete post')
  }
}

export async function incrementPostViewCount({ id }: { id: string }) {
  try {
    return await db
      .update(posts)
      .set({
        viewCount: sql`${posts.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning()
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to increment view count',
    )
  }
}

export async function incrementPostLikeCount({ id }: { id: string }) {
  try {
    return await db
      .update(posts)
      .set({
        likeCount: sql`${posts.likeCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning()
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to increment like count',
    )
  }
}

export async function getPostById({ id }: { id: string }): Promise<{
  id: string
  postId: string
  postType: PostType
  openType: OpenType
  content: string
  category: string | null
  tags: string[]
  userId: string
  title: string | null
  thumbnailUrl: string | null
  createdAt: Date | null
  updatedAt: Date | null
  userEmail: string | null
  readingTime: number
  summary: string | null
  visibility: Visibility
} | null> {
  try {
    const [selectedPost] = await db
      .select({
        // PostContents 필드들
        id: postContents.id,
        postId: postContents.postId,
        content: postContents.content,
        category: postContents.category,
        tags: postContents.tags,
        userId: postContents.userId,
        // Posts에서 가져올 메타데이터
        title: posts.title,
        thumbnailUrl: posts.thumbnailUrl,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        summary: posts.summary,
        // User에서 가져올 이메일
        userEmail: user.email,
        postType: posts.postType,
        openType: posts.openType,
        visibility: posts.visibility,
      })
      .from(postContents)
      .leftJoin(posts, eq(postContents.postId, posts.id))
      .leftJoin(user, eq(postContents.userId, user.id))
      .where(eq(postContents.postId, id))

    if (!selectedPost) {
      return null
    }

    // tags를 쉼표로 구분된 문자열에서 배열로 변환하고 readingTime 계산
    const cleanContent = selectedPost.content
      ? sanitizeHtml(selectedPost.content, { allowedTags: [] })
      : ''
    const readingTime = calculateReadingTime(cleanContent)

    const result = {
      ...selectedPost,
      tags: selectedPost.tags ? selectedPost.tags.split(',') : [],
      readingTime,
    }

    return result
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get post by id')
  }
}

// Posts와 PostContents를 함께 저장하는 함수
export async function savePostWithContents({
  title,
  content,
  category,
  tags,
  thumbnailUrl,
  userId,
  postType,
  openType,
  visibility = 'private',
  summary,
  summaryType = 'auto_truncated',
}: {
  title: string
  content: string
  category?: string
  tags?: string | null
  thumbnailUrl?: string
  userId: string
  postType: PostType
  openType: OpenType
  visibility?: Visibility
  summary?: string
  summaryType?: 'ai_generated' | 'auto_truncated'
}) {
  try {
    const now = new Date()

    // 1. Posts 테이블에 저장
    const [savedPost] = await db
      .insert(posts)
      .values({
        title,
        summary:
          summaryType === 'auto_truncated'
            ? sanitizeHtml(content, {
                allowedTags: [],
                allowedAttributes: {},
              }).substring(0, 200)
            : summary,
        summaryType,
        thumbnailUrl,
        userId,
        postType,
        visibility,
        viewCount: 0,
        likeCount: 0,
        openType,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    // 2. PostContents 테이블에 저장
    const [savedPostContents] = await db
      .insert(postContents)
      .values({
        postId: savedPost.id,
        content,
        category,
        tags,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return {
      post: savedPost,
      postContents: savedPostContents,
    }
  } catch (error) {
    console.error('Failed to save post with contents:', error)
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save post with contents',
    )
  }
}
