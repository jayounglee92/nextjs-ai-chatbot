'use client'

import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { memo } from 'react'
import type { Chat } from '@/lib/db/schema'
import { useRouter } from 'next/navigation'
import { GlobeIcon, LockIcon } from 'lucide-react'

interface PublicChatListProps {
  chats: Chat[]
}

function PurePublicChatList({ chats }: PublicChatListProps) {
  const router = useRouter()

  if (!chats || chats.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">아직 공개 채팅이 없습니다.</p>
          <p className="text-sm text-muted-foreground mt-2">
            첫 번째 공개 채팅을 만들어보세요!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2">
      {chats.map((chat, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`public-chat-${chat.id}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={() => {
              router.push(`/chat/${chat.id}`)
            }}
            className="h-auto w-full flex-1 items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-left text-sm sm:flex-col"
          >
            <div className="flex items-center gap-2 mb-1">
              {chat.visibility === 'public' ? (
                <GlobeIcon className="size-4" />
              ) : (
                <LockIcon className="size-4" />
              )}
              <span className="text-xs text-muted-foreground">
                {chat.visibility === 'public' ? '공개' : '비공개'}
              </span>
            </div>
            <span className="font-medium line-clamp-2">{chat.title}</span>
            <span className="text-muted-foreground text-xs">
              {new Date(chat.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  )
}

export const PublicChatList = memo(
  PurePublicChatList,
  (prevProps, nextProps) => {
    if (prevProps.chats.length !== nextProps.chats.length) return false

    // 채팅 ID가 변경되었는지 확인
    const prevIds = prevProps.chats.map((chat) => chat.id).join(',')
    const nextIds = nextProps.chats.map((chat) => chat.id).join(',')
    if (prevIds !== nextIds) return false

    return true
  },
)
