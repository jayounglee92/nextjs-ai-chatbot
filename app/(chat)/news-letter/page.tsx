'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PencilLineIcon } from 'lucide-react'
import { NewsList } from '@/components/news-list'
import { NewsSkeleton } from '@/components/news-skeleton'
import { Button } from '@/components/ui/button'
import useSWR from 'swr'
import type { Posts } from '@/lib/db/schema'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function NewsLetterPage() {
  const { data: session } = useSession()
  const router = useRouter()

  // Posts 테이블에서 데이터 가져오기
  const { data, error, isLoading } = useSWR<{
    data: (Posts & { category?: string | null; tags?: string[] })[]
    totalCount: number
  }>('/api/news-letter', fetcher)

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

  const handleWriteClick = () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    router.push('/news-letter/write')
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">
          데이터를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">뉴스레터</h1>
            <p className="text-gray-600 mt-2">
              최신 뉴스와 인사이트를 확인해보세요
            </p>
          </div>
          <Button
            onClick={handleWriteClick}
            className="flex items-center gap-2"
          >
            <PencilLineIcon className="w-4 h-4" />
            글쓰기
          </Button>
        </div>

        <NewsSkeleton />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">뉴스레터</h1>
          <p className="text-gray-600 mt-2">
            최신 뉴스와 인사이트를 확인해보세요
          </p>
        </div>
        <Button onClick={handleWriteClick} className="flex items-center gap-2">
          <PencilLineIcon className="w-4 h-4" />
          뉴스 작성하기
        </Button>
      </div>

      <NewsList newsData={newsData} />
    </>
  )
}
