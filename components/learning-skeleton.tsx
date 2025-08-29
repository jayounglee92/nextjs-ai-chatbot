import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function LearningSkeleton() {
  // 고유한 ID 생성
  const generateId = (prefix: string, index: number) =>
    `${prefix}-${Date.now()}-${index}`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card
          key={generateId('learning-skeleton', index)}
          className="shadow-none"
        >
          <CardContent className="p-0">
            {/* 썸네일 스켈레톤 */}
            <div className="relative">
              <Skeleton className="aspect-video w-full rounded-t-lg" />
            </div>

            {/* 콘텐츠 스켈레톤 */}
            <div className="p-4 space-y-3">
              {/* 제목 스켈레톤 */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
              </div>

              {/* 설명 스켈레톤 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>

              {/* 태그 스켈레톤 */}
              <div className="flex gap-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
