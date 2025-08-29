'use client'

import { motion } from 'framer-motion'
import { Button } from './ui/button'
import { memo } from 'react'
import type { UseChatHelpers } from '@ai-sdk/react'
import type { VisibilityType } from './visibility-selector'
import type { ChatMessage } from '@/lib/types'

interface SuggestedActionsProps {
  chatId: string
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage']
  selectedVisibilityType: VisibilityType
}

function PureSuggestedActions({
  chatId,
  sendMessage,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Next.js 의',
      label: '장점은 무엇인가요?',
      action: 'Next.js의 장점은 무엇인가요?',
    },
    {
      title: '다익스트라 알고리즘',
      label: `코드 구현하기`,
      action: `다익스트라 알고리즘 코드 구현하기`,
    },
    {
      title: '실리콘밸리에 대한 에세이',
      label: `작성을 도와주세요.`,
      action: `실리콘밸리는 무엇인가요?`,
    },
    {
      title: 'San Francisco의',
      label: '날씨는 어떤가요?',
      action: 'San Francisco의 날씨는 어떤가요?',
    },
  ]
  return (
    <div
      data-testid="suggested-actions"
      className="grid w-full gap-2 sm:grid-cols-2"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`)

              sendMessage({
                role: 'user',
                parts: [{ type: 'text', text: suggestedAction.action }],
              })
            }}
            className="h-auto w-full flex-1 items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-left text-sm sm:flex-col"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  )
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false

    return true
  },
)
