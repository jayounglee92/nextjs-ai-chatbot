'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AiUseCaseList } from '@/components/ai-use-case-list'
import { AiUseCaseSkeleton } from '@/components/ai-use-case-skeleton'
import { SearchBar } from '@/components/search-bar'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import { ErrorPage } from '@/components/error-page'
import { Button } from '@/components/ui/button'
import type { AiUseCase } from '@/components/ai-use-case-list'
import { USER_TYPES } from '@/app/(auth)/auth'
import { LayoutHeader, WriteButton } from '@/components/layout-header'

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

  const aiUseCases = response?.data || []
  const pagination = response?.pagination

  if (status === 'loading' || isLoading) {
    return (
      <>
        <LayoutHeader
          title="AI 활용 사례"
          subtitle="사내에서 실제로 사용되고 있는 AI 활용 사례를 공유합니다."
          actions={
            session?.user.types.includes(USER_TYPES.AI_ADMIN) ? (
              <WriteButton href="/ai-use-case/write" text="글쓰기" />
            ) : null
          }
        />
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
      <LayoutHeader
        title="AI 활용 사례"
        subtitle="사내에서 실제로 사용되고 있는 AI 활용 사례를 공유합니다."
        actions={
          session?.user.types.includes(USER_TYPES.AI_ADMIN) ? (
            <WriteButton href="/ai-use-case/write" text="글쓰기" />
          ) : null
        }
      />
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
    </>
  )
}
