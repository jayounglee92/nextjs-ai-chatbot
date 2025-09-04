'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { LearningList } from '@/components/learning-list'
import { LearningSkeleton } from '@/components/learning-skeleton'
import { SearchBar } from '@/components/search-bar'
import Link from 'next/link'
import { PencilLineIcon } from 'lucide-react'
import useSWR from 'swr'
import type { LearningCenter } from '@/lib/db/schema'
import { fetcher } from '@/lib/utils'
import { ErrorPage } from '@/components/error-page'
import { Button } from '@/components/ui/button'

// API에서 받는 데이터 타입 (추가 필드 포함)
interface ClientLearningCenter extends Omit<LearningCenter, 'tags'> {
  userEmail: string
  tags: string[] // API에서 배열로 변환되어 넘어옴
}

// 페이지네이션 응답 타입 정의
interface PaginatedResponse {
  data: ClientLearningCenter[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export default function LearningCenterPage() {
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
      ? `/api/learning-center?itemsPerPage=${itemsPerPage}&page=${currentPage}${searchWord ? `&search=${encodeURIComponent(searchWord)}` : ''}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false, // 포커스 시 재검증 비활성화
      revalidateOnReconnect: true, // 재연결 시 재검증 활성화
    },
  )

  // 서버에서 받은 데이터와 페이지네이션 정보
  const learningItems = response?.data || []
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
            <h1 className="text-2xl font-semibold text-foreground">학습센터</h1>
            <Link
              href="/learning-center/write"
              className="rounded-md px-3 py-2 flex items-center gap-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PencilLineIcon className="size-4" /> 동영상 올리기
            </Link>
          </div>
          <p className="text-muted-foreground">
            최신 개발 트렌드와 기술을 배우고, 실무에 바로 적용할 수 있는
            인사이트를 얻어보세요.
          </p>
        </div>
        <div className="mb-6">
          <SearchBar
            placeholder="제목, 설명, 태그으로 검색하세요"
            basePath="/learning-center"
          />
        </div>
        <LearningSkeleton />
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
          <h1 className="text-2xl font-semibold text-foreground">학습센터</h1>
          <Link
            href="/learning-center/write"
            className="rounded-md px-3 py-2 flex items-center gap-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PencilLineIcon className="size-4" /> 동영상 올리기
          </Link>
        </div>
        <p className="text-muted-foreground">
          최신 개발 트렌드와 기술을 배우고, 실무에 바로 적용할 수 있는
          인사이트를 얻어보세요.
        </p>
      </div>

      <div className="mb-6">
        <SearchBar
          placeholder="제목, 설명, 태그로 검색하세요"
          basePath="/learning-center"
        />
      </div>

      <LearningList
        learningItems={learningItems}
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
