'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams, redirect } from 'next/navigation'
import { useEffect } from 'react'
import { AiUseCaseList } from '@/components/ai-use-case-list'
import { AiUseCaseSkeleton } from '@/components/ai-use-case-skeleton'
import { SearchBar } from '@/components/search-bar'
import Link from 'next/link'
import { PencilLineIcon } from 'lucide-react'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import { ErrorPage } from '@/components/error-page'
import { Button } from '@/components/ui/button'
import type { AiUseCase } from '@/components/ai-use-case-list'

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

  // URL 파라미터에서 페이지 번호와 검색어 읽기
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10)
  const searchWord = searchParams.get('search') || ''
  const itemsPerPage = 6

  // SWR을 사용하여 AI Use Case 데이터 조회 (서버 사이드 페이지네이션)
  const {
    data: response,
    error,
    isLoading,
  } = useSWR<PaginatedResponse>(
    session
      ? `/api/post?postType=aiusecase&itemsPerPage=${itemsPerPage}&page=${currentPage}${searchWord ? `&search=${encodeURIComponent(searchWord)}` : ''}`
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

  const handleWriteClick = () => {
    if (!session) {
      redirect('/login')
      return
    }
    router.push('/ai-use-case/write')
  }

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      redirect('/login')
    }
  }, [session, status, router])

  if (status === 'loading' || isLoading) {
    return (
      <>
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
        <div className="mb-6">
          <SearchBar
            placeholder="제목, 내용으로 검색하세요"
            basePath="/ai-use-case"
          />
        </div>
        <AiUseCaseSkeleton />
      </>
    )
  }

  if (error) {
    return ErrorPage({
      title: '데이터를 불러올 수 없습니다',
      description: '잠시 후 다시 시도해주세요.',
      actions: <Button onClick={() => router.push('/')}>홈으로</Button>,
    })
  }

  return (
    <>
      <div className="space-y-4 flex flex-col mb-8">
        <div className="flex items-center gap-2 justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            AI 활용 사례
          </h1>
          {/* 데스크톱에서만 보이는 버튼 */}
          <Button
            onClick={handleWriteClick}
            className="hidden md:flex items-center gap-2"
          >
            <PencilLineIcon className="size-4" />
            글쓰기
          </Button>
        </div>
        <p className="text-muted-foreground">
          사내에서 실제로 사용되고 있는 AI 활용 사례를 공유합니다.
        </p>
      </div>

      <div className="mb-6">
        <SearchBar
          placeholder="제목, 내용으로 검색하세요"
          basePath="/ai-use-case"
        />
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
      {/* 모바일에서만 보이는 floating 버튼 */}
      <Button
        onClick={handleWriteClick}
        className="fixed bottom-6 right-6 z-50 md:hidden rounded-full size-14 shadow-lg hover:shadow-xl transition-all duration-200 p-0"
        size="icon"
      >
        <PencilLineIcon className="size-6" />
      </Button>
    </>
  )
}
