import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { Pagination } from './pagination'
import type { AiUseCase as DbAiUseCase } from '@/lib/db/schema'
import {
  calculateReadingTime,
  getRelativeTimeString,
  stripHtmlTags,
} from '@/lib/utils'
import { EmptyPage } from './empty-page'

interface AiUseCaseListProps {
  useCases: DbAiUseCase[]
  totalItems: number
  itemsPerPage: number
  currentPage: number
  totalPages?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

export function AiUseCaseList({
  useCases,
  totalItems,
  itemsPerPage,
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
}: AiUseCaseListProps) {
  if (useCases.length === 0) {
    return (
      <EmptyPage
        title="목록이 비어있습니다."
        description="새로운 사용 사례를 작성해주세요."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {useCases.map((useCase) => (
          <Link href={`/ai-use-case/${useCase.id}`} key={useCase.id}>
            <Card className="shadow-none">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-2 md:line-clamp-1">
                        {useCase.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {calculateReadingTime(useCase.content) || '5분'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {getRelativeTimeString(useCase.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 h-12">
                      {useCase.content
                        ? (() => {
                            const cleanText = stripHtmlTags(useCase.content)
                            return cleanText.length > 100
                              ? cleanText.substring(0, 200)
                              : cleanText
                          })()
                        : '내용이 없습니다.'}
                    </p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {useCase.userId}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 h-24 w-24 md:h-28 md:w-28 bg-muted rounded-lg overflow-hidden">
                    {useCase.thumbnailUrl ? (
                      <Image
                        src={useCase.thumbnailUrl ?? '/images/thumbnail01.webp'}
                        alt={useCase.title}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">
                          이미지 없음
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
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
    </div>
  )
}
