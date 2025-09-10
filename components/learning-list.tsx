'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { LearningVideoDialog } from './learning-video-dialog'
import { Badge } from './ui/badge'
import { Pagination } from './pagination'
import { EmptyPage } from './empty-page'
import { LearningListActions } from './learning-list-actions'
import { useSearchParams, useRouter } from 'next/navigation'
const MAX_TAGS_COUNT = 6

export interface LearningCenterDetailData {
  id: string
  postId: string
  userId: string
  createdAt: Date
  updatedAt: Date
  content: string
  category: string | null
  summary: string
  readingTime: number
  title: string
  thumbnailUrl: string
  tags: string[]
}
interface LearningListProps {
  learningItems: LearningCenterDetailData[]
  totalItems: number
  itemsPerPage: number
  currentPage: number
  totalPages?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
  openId?: string | null // 모달로 열 항목 ID
}

export function LearningList({
  learningItems,
  totalItems,
  itemsPerPage,
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
}: LearningListProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedItem, setSelectedItem] =
    useState<LearningCenterDetailData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleItemClick = (item: LearningCenterDetailData) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedItem(null)
  }

  if (learningItems && learningItems.length === 0) {
    return (
      <EmptyPage
        title="검색 결과가 없습니다."
        description="검색어를 변경하거나 다른 조건으로 검색해주세요."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {learningItems.map((item) => (
          <Card
            key={item.id}
            className="group shadow-none cursor-pointer flex flex-col h-full"
            onClick={() => handleItemClick(item)}
          >
            <CardContent className="flex flex-col p-0 flex-1">
              {/* 썸네일 영역 */}
              <div className="relative">
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <Image
                    src={item.thumbnailUrl ?? ''}
                    alt={item.title}
                    width={400}
                    height={225}
                    className="object-cover size-full group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* 카테고리 배지 */}
                <div className="absolute top-3 left-3">
                  <Badge
                    variant="secondary"
                    className="bg-black/70 text-white hover:bg-black/80"
                  >
                    {item.category}
                  </Badge>
                </div>

                {/* 플레이 버튼 오버레이 */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="size-16 bg-black/70 rounded-full flex items-center justify-center">
                    <div className="size-0 border-l-[12px] border-l-white border-y-8 border-y-transparent ml-1" />
                  </div>
                </div>
              </div>

              {/* 콘텐츠 영역 */}
              <div className="pt-4 px-4 space-y-3 relative flex-1 flex flex-col pb-2">
                {/* 제목 */}
                <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200 h-11">
                  {item.title}
                </h3>
                {/* 태그들 */}
                <div className="flex flex-wrap gap-1 h-5 overflow-y-hidden">
                  {item?.tags?.length &&
                    item?.tags?.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs h-5"
                      >
                        {tag}
                      </Badge>
                    ))}
                </div>

                {/* 액션 버튼들 */}
                <div className="flex justify-end mt-auto -mb-4">
                  <LearningListActions id={item.id} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 페이지네이션 */}
      <Pagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
      />
      {/* YouTube 비디오 다이얼로그 */}
      <LearningVideoDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        learningItem={selectedItem}
      />
    </div>
  )
}
