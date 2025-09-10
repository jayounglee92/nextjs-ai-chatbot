import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { Pagination } from './pagination'
import { getRelativeTimeString } from '@/lib/utils'
import { EmptyPage } from './empty-page'
import type { PostContents } from '@/lib/db/schema'
export interface AiUseCase extends PostContents {
  summary: string
  readingTime: number
  userEmail: string
  title: string
  thumbnailUrl: string
}
interface AiUseCaseListProps {
  useCases: AiUseCase[]
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
        title="검색 결과가 없습니다."
        description="검색어를 변경하거나 다른 조건으로 검색해주세요."
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
                          <Clock className="size-4" />
                          <span>{useCase.readingTime}분</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="size-4" />
                          <span>
                            {getRelativeTimeString({
                              dateString: useCase.createdAt,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 h-12">
                      {useCase.summary}
                    </p>
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                        {useCase.userEmail}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 size-24 md:size-28 bg-muted rounded-lg overflow-hidden">
                    {useCase.thumbnailUrl ? (
                      <Image
                        src={useCase.thumbnailUrl}
                        alt={useCase.title}
                        width={80}
                        height={80}
                        className="object-cover size-full"
                      />
                    ) : (
                      <div className="size-full bg-muted flex items-center justify-center">
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
