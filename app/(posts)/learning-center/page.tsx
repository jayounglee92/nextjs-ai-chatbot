'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  type LearningCenterDetailData,
  LearningList,
} from '@/components/learning-list'
import { LearningSkeleton } from '@/components/learning-skeleton'
import { SearchBar } from '@/components/search-bar'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import { ErrorPage } from '@/components/error-page'
import { Button } from '@/components/ui/button'
import { USER_TYPES } from '@/app/(auth)/auth'
import { LayoutHeader, WriteButton } from '@/components/layout-header'

// 페이지네이션 응답 타입 정의
interface PaginatedResponse {
  data: LearningCenterDetailData[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export default function Page() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터에서 페이지 번호와 검색어 읽기
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10)
  const searchWord = searchParams.get('search') || ''

  const itemsPerPage = 6

  // SWR을 사용하여 Learning Center 데이터 조회 (서버 사이드 페이지네이션)
  const {
    data: response,
    error,
    isLoading,
  } = useSWR<PaginatedResponse>(
    session
      ? `/api/post?postType=learningcenter&itemsPerPage=${itemsPerPage}&page=${currentPage}${searchWord ? `&search=${encodeURIComponent(searchWord)}` : ''}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false, // 포커스 시 재검증 비활성화
      revalidateOnReconnect: true, // 재연결 시 재검증 활성화
    },
  )

  const learningItems = response?.data
  const pagination = response?.pagination

  if (status === 'loading' || isLoading) {
    return (
      <>
        <LayoutHeader
          title="학습센터"
          subtitle="최신 개발 트렌드와 기술을 배우고, 실무에 바로 적용할 수 있는
            인사이트를 얻어보세요."
          actions={
            session?.user.types.includes(USER_TYPES.AI_ADMIN) ? (
              <WriteButton href="/learning-center/write" text="동영상 올리기" />
            ) : null
          }
        />
        <div className="mb-6">
          <SearchBar
            placeholder="제목, 설명, 태그로 검색하세요"
            basePath="/learning-center"
          />
        </div>
        <LearningSkeleton />
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
        title="학습센터"
        subtitle="최신 개발 트렌드와 기술을 배우고, 실무에 바로 적용할 수 있는
            인사이트를 얻어보세요."
        actions={
          session?.user.types.includes(USER_TYPES.AI_ADMIN) ? (
            <WriteButton href="/learning-center/write" text="동영상 올리기" />
          ) : null
        }
      />
      <div className="mb-6">
        <SearchBar
          placeholder="제목, 설명, 태그로 검색하세요"
          basePath="/learning-center"
        />
      </div>
      <LearningList
        learningItems={learningItems || []}
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
