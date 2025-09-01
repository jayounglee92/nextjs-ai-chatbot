'use client'

import { useRouter } from 'next/navigation'
import { Share2, EllipsisVertical } from 'lucide-react'
import type { AiUseCase } from '@/lib/db/schema'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  handleApiError,
  handleFetchError,
  showSuccessToast,
} from '@/lib/toast-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface Props {
  useCase: AiUseCase
}

export function AiUseCaseActions({ useCase }: Props) {
  const router = useRouter()

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    showSuccessToast('링크가 클립보드에 복사되었습니다!')
  }

  const handleDelete = async () => {
    if (!confirm('정말로 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/ai-use-case?id=${useCase.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showSuccessToast('AI 활용사례가 삭제되었습니다!')
        router.push('/ai-use-case')
      } else {
        await handleApiError(response, router, {
          forbiddenMessage: '본인이 작성한 AI 활용사례만 삭제할 수 있습니다',
          notFoundMessage: '이미 삭제되었거나 존재하지 않는 AI 활용사례입니다',
        })
      }
    } catch (error) {
      handleFetchError(error, router, '삭제')
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={handleShare}>
            <Share2 className="h-6 w-6" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>공유</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button">
            <EllipsisVertical className="h-6 w-6" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={`/ai-use-case/${useCase.id}/edit`}>수정</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <button
              type="button"
              onClick={handleDelete}
              className="w-full text-left"
            >
              삭제
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
