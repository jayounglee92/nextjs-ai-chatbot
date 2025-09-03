'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { AiUseCaseList } from '@/components/ai-use-case-list'
import { AiUseCaseSkeleton } from '@/components/ai-use-case-skeleton'
import Link from 'next/link'
import { PencilLineIcon } from 'lucide-react'
import useSWR from 'swr'
import type { AiUseCase } from '@/lib/db/schema'
import { fetcher } from '@/lib/utils'
import { ErrorPage } from '@/components/error-page'
import { Button } from '@/components/ui/button'

// 페이지네이션 응답 타입 정의
interface PaginatedResponse {
  data: AiUseCase[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export default function AiUseCasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터에서 페이지 번호 읽기
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10)
  const itemsPerPage = 6

  // SWR을 사용하여 AI Use Case 데이터 조회 (서버 사이드 페이지네이션)
  const {
    data: response,
    error,
    isLoading,
  } = useSWR<PaginatedResponse>(
    session
      ? `/api/ai-use-case?itemsPerPage=${itemsPerPage}&page=${currentPage}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false, // 포커스 시 재검증 비활성화
      revalidateOnReconnect: true, // 재연결 시 재검증 활성화
    },
  )

  // 서버에서 받은 데이터와 페이지네이션 정보
  const aiUseCases = response?.data || []
  const pagination = response?.pagination

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="space-y-4 flex flex-col mb-8">
          <div className="flex items-center gap-2 justify-between">
            <h1 className="text-2xl font-semibold text-foreground">
              AI 활용 사례
            </h1>
            <Link
              href="/ai-use-case/write"
              className="rounded-md px-3 py-2 flex items-center gap-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PencilLineIcon className="size-4" /> 글쓰기
            </Link>
          </div>
          <p className="text-muted-foreground">
            사내에서 실제로 사용되고 있는 AI 활용 사례를 공유합니다.
          </p>
        </div>
        <AiUseCaseSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorPage
        title="데이터를 불러올 수 없습니다"
        description="잠시 후 다시 시도해주세요."
        actions={<Button onClick={() => router.push('/')}>홈으로</Button>}
      />
    )
  }

  if (!session) {
    return <div />
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="space-y-4 flex flex-col mb-8">
        <div className="flex items-center gap-2 justify-between">
          <h1 className="text-2xl font-semibold text-foreground ">
            AI 활용 사례
          </h1>
          <Link
            href="/ai-use-case/write"
            className="rounded-md px-3 py-2 flex items-center gap-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PencilLineIcon className="size-4" /> 글쓰기
          </Link>
        </div>
        <p className="text-muted-foreground">
          사내에서 실제로 사용되고 있는 AI 활용 사례를 공유합니다.
        </p>
      </div>

      <AiUseCaseList
        useCases={aiUseCases}
        totalItems={pagination?.totalCount || 0}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalPages={pagination?.totalPages || 0}
        hasNextPage={pagination?.hasNextPage || false}
        hasPrevPage={pagination?.hasPrevPage || false}
      />
    </div>
  )
}
