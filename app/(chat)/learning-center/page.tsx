'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LearningList } from '@/components/learning-list'
import { LearningSkeleton } from '@/components/learning-skeleton'
import { learningItems } from '@/lib/data/learning-center'

export default function LearningCenterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)

  // URL 파라미터에서 페이지 번호 읽기
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10)
  const itemsPerPage = 6
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  // 현재 페이지에 해당하는 데이터만 표시
  const paginatedItems = learningItems.slice(startIndex, endIndex)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // 임시 로딩 시뮬레이션 (나중에 API 호출로 대체)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1200) // 1.2초 후 로딩 완료

    return () => clearTimeout(timer)
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex flex-1 flex-col">
        <div className="space-y-4 flex flex-col mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">학습센터</h1>
          </div>
          <p className="text-muted-foreground">
            최신 개발 트렌드와 기술을 배우고, 실무에 바로 적용할 수 있는
            인사이트를 얻어보세요.
          </p>
        </div>

        <div className="flex-1">
          <LearningSkeleton />
        </div>
      </div>
    )
  }

  if (!session) {
    return <div />
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="space-y-4 flex flex-col mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">학습센터</h1>
        </div>
        <p className="text-muted-foreground">
          최신 개발 트렌드와 기술을 배우고, 실무에 바로 적용할 수 있는
          인사이트를 얻어보세요.
        </p>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <LearningSkeleton />
        ) : (
          <LearningList
            items={paginatedItems}
            totalItems={learningItems.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
          />
        )}
      </div>
    </div>
  )
}
