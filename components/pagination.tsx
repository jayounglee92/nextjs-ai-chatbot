'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
}

export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(totalItems / itemsPerPage)

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
        disabled={currentPage === 1}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* 페이지 번호들 */}
      <div className="flex items-center space-x-1">
        {getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changePage(page)}
            className="min-w-[40px]"
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
        disabled={currentPage === totalPages}
        className="flex items-center gap-1"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
