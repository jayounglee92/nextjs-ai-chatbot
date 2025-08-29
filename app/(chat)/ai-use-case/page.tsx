'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AiUseCaseList } from '@/components/ai-use-case-list'
import { AiUseCaseSkeleton } from '@/components/ai-use-case-skeleton'
import { aiUseCases } from '@/lib/data/ai-use-cases'
import Link from 'next/link'
import { PencilLineIcon } from 'lucide-react'

export default function AiUseCasePage() {
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
  const paginatedUseCases = aiUseCases.slice(startIndex, endIndex)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // 임시 로딩 시뮬레이션 (나중에 API 호출로 대체)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500) // 1.5초 후 로딩 완료

    return () => clearTimeout(timer)
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex flex-1 flex-col">
        <div className="space-y-4 flex flex-col mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">
              AI 활용 사례
            </h1>
            <Link
              href="/ai-use-case/write"
              className="rounded-md px-3 py-2 flex items-center gap-1 text-sm bg-amber-500 text-primary-foreground hover:bg-amber-500/90"
            >
              <PencilLineIcon className="w-4 h-4" /> 글쓰기
            </Link>
          </div>
          <p className="text-muted-foreground">
            최신 개발 트렌드와 기술을 배우고, 실무에 바로 적용할 수 있는
            인사이트를 얻어보세요.
          </p>
        </div>
        <AiUseCaseSkeleton />
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
          <h1 className="text-2xl font-semibold text-foreground">
            AI 활용 사례
          </h1>
        </div>
        <p className="text-muted-foreground">
          사내에서 실제로 사용되고 있는 AI 활용 사례를 공유합니다.
        </p>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <AiUseCaseSkeleton />
        ) : (
          <AiUseCaseList
            useCases={paginatedUseCases}
            totalItems={aiUseCases.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
          />
        )}
      </div>
    </div>
  )
}
