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

// SWR fetcher 함수
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AiUseCasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터에서 페이지 번호 읽기
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10)
  const itemsPerPage = 2
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  // SWR을 사용하여 AI Use Case 데이터 조회
  const {
    data: aiUseCases,
    error,
    isLoading,
  } = useSWR<AiUseCase[]>(session ? '/api/ai-use-case' : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })

  // 현재 페이지에 해당하는 데이터만 표시
  const paginatedUseCases = aiUseCases?.slice(startIndex, endIndex) || []

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
              <PencilLineIcon className="w-4 h-4" /> 글쓰기
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
              <PencilLineIcon className="w-4 h-4" /> 글쓰기
            </Link>
          </div>
          <p className="text-muted-foreground">
            사내에서 실제로 사용되고 있는 AI 활용 사례를 공유합니다.
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              데이터를 불러올 수 없습니다
            </h2>
            <p className="text-muted-foreground">잠시 후 다시 시도해주세요.</p>
          </div>
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
        <div className="flex items-center gap-2 justify-between">
          <h1 className="text-2xl font-semibold text-foreground ">
            AI 활용 사례
          </h1>
          <Link
            href="/ai-use-case/write"
            className="rounded-md px-3 py-2 flex items-center gap-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PencilLineIcon className="w-4 h-4" /> 글쓰기
          </Link>
        </div>
        <p className="text-muted-foreground">
          사내에서 실제로 사용되고 있는 AI 활용 사례를 공유합니다.
        </p>
      </div>

      <div className="flex-1">
        <AiUseCaseList
          useCases={paginatedUseCases}
          totalItems={aiUseCases?.length || 0}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
        />
      </div>
    </div>
  )
}
