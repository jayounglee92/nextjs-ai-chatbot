'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { NewsList } from '@/components/news-list'
import { NewsSkeleton } from '@/components/news-skeleton'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'
import type { Posts } from '@/lib/db/schema'
import { ErrorPage } from '@/components/error-page'
import { fetcher } from '@/lib/utils'
import { useState } from 'react'
import { USER_TYPES } from '@/app/(auth)/auth'
import { LayoutHeader, WriteButton } from '@/components/layout-header'

interface PaginatedResponse {
  data: (Posts & {
    category?: string | null
    tags?: string[]
    readingTime?: string
    userEmail?: string | null
  })[]
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)

  // Posts 테이블에서 데이터 가져오기 (페이지네이션 적용)
  const { data, error, isLoading } = useSWR<PaginatedResponse>(
    `/api/post?postType=news&itemsPerPage=${itemsPerPage}&page=${currentPage}`,
    fetcher,
  )

  // Posts 데이터를 NewsItem 형태로 변환
  const newsData = (data?.data || []).map((post) => ({
    id: post.id,
    title: post.title,
    description: post.summary || '',
    image: post.thumbnailUrl || '', // 기본 이미지
    category: post.category || '',
    publishedAt: post.createdAt,
    sourceCount: post.viewCount,
  }))

  if (error) {
    return ErrorPage({
      title: '데이터를 불러오는 중 오류가 발생했습니다.',
      description: '잠시 후 다시 시도해주세요.',
      actions: <Button onClick={() => router.push('/')}>홈으로</Button>,
    })
  }

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
      <NewsList newsData={newsData} />

      {/* 페이지네이션 */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!data.pagination.hasPrevPage}
          >
            이전
          </Button>

          <div className="flex gap-1">
            {Array.from(
              { length: data.pagination.totalPages },
              (_, i) => i + 1,
            ).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="size-10"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!data.pagination.hasNextPage}
          >
            다음
          </Button>
        </div>
      )}
    </>
  )
}
