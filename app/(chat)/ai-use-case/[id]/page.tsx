'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User, Share2, Clock, EllipsisVerticalIcon } from 'lucide-react'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import type { AiUseCase } from '@/lib/db/schema'
import { calculateReadingTime, getRelativeTimeString } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

export default function AiUseCaseDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [useCase, setUseCase] = useState<AiUseCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (params.id && session) {
      fetchAiUseCase(params.id as string)
    }
  }, [params.id, session])

  const fetchAiUseCase = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/ai-use-case?id=${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('AI 활용사례를 찾을 수 없습니다.')
        } else {
          setError('AI 활용사례를 불러오는데 실패했습니다.')
        }
        return
      }

      const data = await response.json()
      setUseCase(data)
    } catch (err) {
      console.error('Failed to fetch AI use case:', err)
      setError('AI 활용사례를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('링크가 클립보드에 복사되었습니다!')
  }

  const handleDelete = () => {
    fetch(`/api/ai-use-case?id=${useCase?.id}`, {
      method: 'DELETE',
    })
    toast.success('AI 활용사례가 삭제되었습니다!')
    router.push('/ai-use-case')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <div />
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            오류가 발생했습니다
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push('/ai-use-case')}>목록으로</Button>
        </div>
      </div>
    )
  }

  if (!useCase) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            AI 활용사례를 찾을 수 없습니다
          </h2>
          <p className="text-muted-foreground mb-4">
            요청하신 ID의 AI 활용사례가 존재하지 않습니다.
          </p>
          <Button onClick={() => router.push('/ai-use-case')}>목록으로</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="grid grid-cols-1">
        {/* 제목 */}
        <div>
          <Link href="/ai-use-case">AI 활용 사례</Link>
          <h1 className="text-4xl font-bold text-foreground my-6">
            {useCase.title}
          </h1>

          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-4">
            <span className="flex gap-2 items-center">
              <User className="h-5 w-5 border rounded-full" />
              {useCase.userId}
            </span>
            <span className="text-gray-300 font-bold">|</span>
            <span className="flex gap-2 items-center">
              <Clock className="h-5 w-5" />
              {calculateReadingTime(useCase.content)}
            </span>
            <span className="text-gray-300 font-bold">|</span>
            <span>{getRelativeTimeString(useCase.createdAt)}</span>
            <div className="flex gap-6 ml-auto">
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
                    <EllipsisVerticalIcon className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Link href={`/ai-use-case/${useCase.id}/edit`}>수정</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <button type="button" onClick={handleDelete}>
                      삭제
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <hr className="my-10 border-t-2 border-primary" />
        <SimpleEditor viewMode={true} initialContent={useCase.content} />
      </div>
    </div>
  )
}
