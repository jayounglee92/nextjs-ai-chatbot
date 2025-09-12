'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NewsList } from '@/components/news-list'
import { NewsSkeleton } from '@/components/news-skeleton'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'
import type { PostContents } from '@/lib/db/schema'
import { ErrorPage } from '@/components/error-page'
import { fetcher } from '@/lib/utils'
import { USER_TYPES } from '@/app/(auth)/auth'
import { LayoutHeader, WriteButton } from '@/components/layout-header'

export interface NewsItem extends PostContents {
  summary: string
  readingTime: number
  userEmail: string
  title: string
  thumbnailUrl: string
}
interface PaginatedResponse {
  data: NewsItem[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export default function NewsLetterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10)
  const searchWord = searchParams.get('search') || ''
  const itemsPerPage = 6

  // Posts 테이블에서 데이터 가져오기 (페이지네이션 적용)
  const {
    data: response,
    error,
    isLoading,
  } = useSWR<PaginatedResponse>(
    session
      ? `/api/post?postType=news&itemsPerPage=${itemsPerPage}&page=${currentPage}${searchWord ? `&search=${encodeURIComponent(searchWord)}` : ''}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false, // 포커스 시 재검증 비활성화
      revalidateOnReconnect: true, // 재연결 시 재검증 활성화
    },
  )

  const newsData = response?.data || []
  const pagination = response?.pagination

  if (status === 'loading' || isLoading) {
    return (
      <>
        <LayoutHeader
          title="뉴스레터"
          subtitle="최신 뉴스와 인사이트를 확인해보세요"
          actions={
            session?.user.types.includes(USER_TYPES.AI_ADMIN) ? (
              <WriteButton href="/news-letter/write" text="뉴스 작성하기" />
            ) : null
          }
        />
        <NewsSkeleton />
      </>
    )
  }

  if (error) {
    return ErrorPage({
      title: '데이터를 불러오는 중 오류가 발생했습니다.',
      description: '잠시 후 다시 시도해주세요.',
      actions: <Button onClick={() => router.push('/')}>홈으로</Button>,
    })
  }

  return (
    <>
      <LayoutHeader
        title="뉴스레터"
        subtitle="최신 뉴스와 인사이트를 확인해보세요"
        actions={
          session?.user.types.includes(USER_TYPES.AI_ADMIN) ? (
            <WriteButton href="/news-letter/write" text="뉴스 작성하기" />
          ) : null
        }
      />
      <NewsList
        newsData={newsData}
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
