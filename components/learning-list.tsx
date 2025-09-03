'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import type { LearningCenter } from '@/lib/db/schema'

// API에서 받는 데이터 타입 (tags가 배열로 변환됨)
interface ProcessedLearningCenter extends Omit<LearningCenter, 'tags'> {
  tags: string[]
}
import { LearningVideoDialog } from './learning-video-dialog'
import { Badge } from './ui/badge'
import { Pagination } from './pagination'
import { EmptyPage } from './empty-page'

interface LearningListProps {
  learningItems: ProcessedLearningCenter[]
  totalItems: number
  itemsPerPage: number
  currentPage: number
  totalPages?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
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
  const [selectedItem, setSelectedItem] =
    useState<ProcessedLearningCenter | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleItemClick = (item: ProcessedLearningCenter) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedItem(null)
  }

  if (learningItems.length === 0) {
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
            className="group shadow-none cursor-pointer"
            onClick={() => handleItemClick(item)}
          >
            <CardContent className="p-0">
              {/* 썸네일 영역 */}
              <div className="relative">
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <Image
                    src={item.thumbnail}
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
                    <div className="size-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
                  </div>
                </div>
              </div>

              {/* 콘텐츠 영역 */}
              <div className="p-4 space-y-3">
                {/* 제목 */}
                <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
                  {item.title}
                </h3>

                {/* 설명 */}
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {/* 태그들 */}
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
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
