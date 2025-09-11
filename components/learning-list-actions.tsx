'use client'

import { EllipsisVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { Button } from './ui/button'
import {
  handleApiError,
  handleFetchError,
  showSuccessToast,
} from '@/lib/toast-utils'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { USER_TYPES } from '@/app/(auth)/auth'
import { useSWRConfig } from 'swr'
import { cn } from '@/lib/utils'

interface Props {
  postId: string
  onClose: () => void
  className?: string
}

export function LearningListActions({ postId, onClose, className }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const { mutate } = useSWRConfig()

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (!confirm('정말로 삭제하시겠습니까?')) return

    try {
      // 낙관적 업데이트: 먼저 UI에서 제거
      mutate(
        (key) => typeof key === 'string' && key.includes('/api/post'),
        (currentData: any) => {
          if (!currentData?.data) return currentData

          return {
            ...currentData,
            data: currentData.data.filter((item: any) => item.id !== postId),
          }
        },
        { revalidate: false },
      )

      const response = await fetch(`/api/post?id=${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // 성공 시 데이터 재검증
        mutate((key) => typeof key === 'string' && key.includes('/api/post'))
        onClose()
        // 성공 시 토스트 표시
        showSuccessToast('학습 자료가 삭제되었습니다!')
      } else {
        // 실패 시 원래 데이터로 되돌리기
        mutate((key) => typeof key === 'string' && key.includes('/api/post'))
        await handleApiError(response, router, {
          forbiddenMessage: '본인이 작성한 학습 자료만 삭제할 수 있습니다',
          notFoundMessage: '이미 삭제되었거나 존재하지 않는 학습 자료입니다',
        })
      }
    } catch (error) {
      // 에러 시 원래 데이터로 되돌리기
      mutate((key) => typeof key === 'string' && key.includes('/api/post'))
      handleFetchError(error, router, '삭제')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'rounded-full size-8 focus-visible:ring-0 focus-visible:ring-offset-0 self-end',
            className,
          )}
        >
          <EllipsisVertical className="size-8" />
        </Button>
      </DropdownMenuTrigger>
      {session?.user.types.includes(USER_TYPES.AI_ADMIN) && (
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link
              href={`/learning-center/${postId}/edit`}
              className="cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              수정
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <button
              type="button"
              onClick={handleDelete}
              className="w-full text-left cursor-pointer"
            >
              삭제
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
