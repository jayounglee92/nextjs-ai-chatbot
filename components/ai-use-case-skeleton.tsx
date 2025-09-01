import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AiUseCaseSkeleton() {
  // 고유한 ID 생성
  const generateId = (prefix: string, index: number) =>
    `${prefix}-${Date.now()}-${index}`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card
            key={generateId('skeleton-card', index)}
            className="shadow-none"
          >
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Skeleton className="h-24 w-24 md:h-28 md:w-28 rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
