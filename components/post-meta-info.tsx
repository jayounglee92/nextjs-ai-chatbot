import { User, Clock } from 'lucide-react'
import { calculateReadingTime, getRelativeTimeString } from '@/lib/utils'
import React from 'react'
import type { ReactNode } from 'react'

// 메타 정보 아이템 타입
export type MetaItemType =
  | 'author'
  | 'date'
  | 'relativeTime'
  | 'readingTime'
  | 'category'
  | 'custom'
  | 'actions'

interface MetaItem {
  type: MetaItemType
  content?: ReactNode
  data?: any // 각 타입별 데이터
}

interface PostMetaInfoProps {
  items: MetaItem[]
  className?: string
}

export function PostMetaInfo({ items, className = '' }: PostMetaInfoProps) {
  const renderMetaItem = (item: MetaItem, index: number) => {
    const isLast = index === items.length - 1
    const separator = isLast ? null : <span className="text-gray-300">|</span>

    switch (item.type) {
      case 'author': {
        const author = item.data as { email: string; name?: string }
        return (
          <span className="flex gap-2 items-center">
            <User className="size-5 border rounded-full" />
            {author.name || author.email}
          </span>
        )
      }

      case 'date': {
        const date = item.data as Date
        return <span>{date.toLocaleDateString('ko-KR')}</span>
      }

      case 'relativeTime': {
        const createdAt = item.data as Date
        return <span>{getRelativeTimeString(createdAt)}</span>
      }

      case 'readingTime': {
        const content = item.data as string
        return (
          <span className="flex gap-2 items-center">
            <Clock className="size-5" />
            {calculateReadingTime(content)}
          </span>
        )
      }

      case 'category': {
        const category = item.data as string
        return <span>{category}</span>
      }

      case 'custom':
        return <>{item.content}</>

      default:
        return null
    }
  }

  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={`${item.type}-${index}`}>
          {renderMetaItem(item, index)}
          {index !== items.length - 1 && (
            <span className="text-gray-300">|</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
