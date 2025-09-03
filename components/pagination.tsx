'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  totalPages?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  totalPages: serverTotalPages,
  hasNextPage,
  hasPrevPage,
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 서버에서 받은 totalPages가 있으면 사용, 없으면 클라이언트에서 계산
  const totalPages = serverTotalPages || Math.ceil(totalItems / itemsPerPage)

  // 페이지 변경 함수
  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return

    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  // 페이지 번호 배열 생성 (최대 5개 표시)
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 5개 이하면 모든 페이지 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 현재 페이지를 중심으로 5개 페이지 표시
      const start = Math.max(1, currentPage - 2)
      const end = Math.min(totalPages, start + maxVisiblePages - 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center space-x-2">
      {/* 이전 페이지 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => changePage(currentPage - 1)}
        disabled={hasPrevPage === false || currentPage === 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {/* 페이지 번호들 */}
      <div className="flex items-center space-x-1">
        {getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changePage(page)}
            className="min-w-40"
          >
            {page}
          </Button>
        ))}
      </div>

      {/* 다음 페이지 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => changePage(currentPage + 1)}
        disabled={hasNextPage === false || currentPage === totalPages}
        className="flex items-center gap-1"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
