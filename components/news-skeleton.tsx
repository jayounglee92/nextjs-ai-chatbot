import { Skeleton } from '@/components/ui/skeleton'

export function NewsSkeleton() {
  // 고유한 ID 생성
  const generateId = (prefix: string, index: number) =>
    `${prefix}-${Date.now()}-${index}`

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* 첫 번째 아이템 - Wide 스켈레톤 (글 왼쪽, 그림 오른쪽) */}
      <article className="md:py-4 border rounded-lg md:rounded-none md:border-x-0 overflow-hidden bg-white col-span-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-8">
          {/* 콘텐츠 스켈레톤 */}
          <div className="p-4 md:px-0 order-2 keep-all md:col-span-3">
            <div className="flex flex-col justify-center h-full space-y-3">
              {/* 제목 스켈레톤 */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-3/4" />
              </div>

              {/* 설명 스켈레톤 (데스크톱에서만) */}
              <div className="space-y-2 hidden md:block">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>

              {/* 시간 정보 스켈레톤 */}
              <div className="flex items-center gap-1">
                <Skeleton className="size-3 rounded" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>

          {/* 이미지 스켈레톤 */}
          <div className="relative md:col-span-2 overflow-hidden h-48 md:h-60 rounded-lg order-1 md:order-2">
            <Skeleton className="w-full h-full" />
            {/* 카테고리 스켈레톤 */}
            <div className="absolute top-3 left-3">
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </div>
        </div>
      </article>

      {/* 나머지 아이템들 - 3,2,3,2 패턴 스켈레톤 */}
      {Array.from({ length: 8 }).map((_, index) => {
        const position = index % 5 // 0,1,2,3,4 반복
        const isWide = position === 3 || position === 4 // 2줄 그리드
        const isWideRight = position === 4 // 4번째 (2줄 그리드 - 글 오른쪽, 그림 왼쪽)
        const isThreeColumn = position === 0 || position === 1 || position === 2 // 0,1,2번째 (3줄 그리드)

        if (isWide) {
          return (
            <article
              key={generateId('wide-skeleton', index)}
              className="md:py-4 border rounded-lg md:rounded-none md:border-x-0 overflow-hidden bg-white col-span-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                {/* 콘텐츠 스켈레톤 */}
                <div
                  className={`p-4 md:p-6 order-2 md:col-span-3 ${
                    isWideRight ? 'md:order-2' : 'md:order-1'
                  }`}
                >
                  <div className="flex flex-col justify-center h-full space-y-3">
                    {/* 제목 스켈레톤 */}
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-4/5" />
                    </div>

                    {/* 설명 스켈레톤 (데스크톱에서만) */}
                    <div className="space-y-2 hidden md:block">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>

                    {/* 시간 정보 스켈레톤 */}
                    <div className="flex items-center gap-1">
                      <Skeleton className="size-3 rounded" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>

                {/* 이미지 스켈레톤 */}
                <div
                  className={`relative md:col-span-2 overflow-hidden h-48 md:h-60 rounded-lg ${
                    isWideRight ? 'md:order-1' : 'md:order-2'
                  }`}
                >
                  <Skeleton className="w-full h-full" />
                  {/* 카테고리 스켈레톤 */}
                  <div className="absolute top-3 left-3">
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                </div>
              </div>
            </article>
          )
        }

        if (isThreeColumn) {
          return (
            <article
              key={generateId('three-column-skeleton', index)}
              className="border rounded-lg overflow-hidden bg-white col-span-12 md:col-span-4"
            >
              <div className="flex flex-col">
                {/* 이미지 스켈레톤 */}
                <div className="relative rounded-lg overflow-hidden h-48">
                  <Skeleton className="w-full h-full" />
                  {/* 카테고리 스켈레톤 */}
                  <div className="absolute top-3 left-3">
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                </div>

                {/* 콘텐츠 스켈레톤 */}
                <div className="p-4 space-y-3">
                  {/* 제목 스켈레톤 */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>

                  {/* 시간 정보 스켈레톤 */}
                  <div className="flex items-center gap-1">
                    <Skeleton className="size-3 rounded" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
            </article>
          )
        }

        return null
      })}
    </div>
  )
}
