import type {
  CoreAssistantMessage,
  CoreToolMessage,
  UIMessage,
  UIMessagePart,
} from 'ai'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DBMessage, Document } from '@/lib/db/schema'
import { ChatSDKError, type ErrorCode } from './errors'
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types'
import { formatISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    const { code, cause } = await response.json()
    throw new ChatSDKError(code as ErrorCode, cause)
  }

  return response.json()
}

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init)

    if (!response.ok) {
      const { code, cause } = await response.json()
      throw new ChatSDKError(code as ErrorCode, cause)
    }

    return response
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat')
    }

    throw error
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]')
  }
  return []
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage
type ResponseMessage = ResponseMessageWithoutId & { id: string }

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user')
  return userMessages.at(-1)
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date()
  if (index > documents.length) return new Date()

  return documents[index].createdAt
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>
}): string | null {
  const trailingMessage = messages.at(-1)

  if (!trailingMessage) return null

  return trailingMessage.id
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '')
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }))
}

export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

/**
 * 상대적인 시간 문자열을 반환하는 함수
 * @param dateString 날짜 문자열 또는 Date 객체
 * @returns 상대적인 시간 문자열
 * @example
 * getRelativeTimeString('2024-12-31') // 오늘
 * getRelativeTimeString('2024-12-30') // 1일 전
 * getRelativeTimeString('2024-12-25') // 6일 전
 * getRelativeTimeString('2024-12-01') // 2024. 12. 1.
 */
export function getRelativeTimeString(dateString: string | Date): string {
  const now = new Date()
  const date = new Date(dateString)

  // 날짜만 비교하기 위해 시간을 00:00:00으로 설정
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )

  const diffInMs = nowDate.getTime() - targetDate.getTime()
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return '오늘'
  } else if (diffInDays === 1) {
    return '1일 전'
  } else if (diffInDays === 2) {
    return '2일 전'
  } else if (diffInDays <= 7) {
    return `${diffInDays}일 전`
  } else {
    // 일주일이 지나면 날짜로 표시
    return date.toLocaleDateString('ko-KR')
  }
}

/**
 * HTML 콘텐츠에서 읽는 시간을 계산하는 함수
 * @param htmlContent HTML 콘텐츠
 * @returns 읽는 시간
 * @example
 * calculateReadingTime('<p>Hello, world!</p>') // 0분
 */
export function calculateReadingTime(textContent: string): string {
  // 한글, 영문, 숫자, 특수문자 포함한 전체 글자 수 계산
  const totalCharacters = textContent.length

  // 한국어 평균 읽기 속도: 300-400자/분 (350자/분으로 설정)
  const readingSpeedPerMinute = 350

  // 읽는 시간 계산 (분 단위)
  const readingTimeMinutes = Math.max(
    1,
    Math.round(totalCharacters / readingSpeedPerMinute),
  )

  return `${readingTimeMinutes}분`
}

/**
 * 에러 메시지들을 하나의 문자열로 합치는 유틸 함수
 */
export function formatValidationErrors(errors: string[]): string {
  return errors.join('\n')
}

// 날짜 포맷팅 함수
export function formatCreatedAt(dateString: string | Date): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  // 오늘 내에 게시된 경우
  if (diffInDays === 0) {
    if (diffInMinutes < 1) {
      return '방금 전'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    } else {
      return `${diffInHours}시간 전`
    }
  }

  // 어제나 과거에 게시된 경우
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/*
 * 게시된 날짜를 포맷팅하는 함수
 * @param dateString 날짜 문자열 또는 Date 객체
 * @returns 날짜 포맷팅 문자열
 */
export function formatPublishedDate(dateString: string | Date): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  // 오늘 내에 게시된 경우
  if (diffInDays === 0) {
    if (diffInMinutes < 1) {
      // 1분 전
      return '방금 전'
    } else if (diffInMinutes < 60) {
      // 60분 전
      return `${diffInMinutes}분 전`
    } else {
      return `${diffInHours}시간 전` // 1시간 이후
    }
  }

  // 어제나 과거에 게시된 경우
  return date.toLocaleDateString('ko-KR', {
    // 2024. 12. 31.
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
