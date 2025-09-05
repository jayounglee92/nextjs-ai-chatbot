import { Skeleton } from '@/components/ui/skeleton'

export function NewsEditSkeleton() {
  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* 제목 라벨 스켈레톤 */}
      <div className="mb-2">
        <Skeleton className="h-4 w-16" />
      </div>

      {/* 제목 입력 필드 스켈레톤 */}
      <div className="mb-6">
        <Skeleton className="w-full h-12" />
      </div>

      {/* 에디터 스켈레톤 */}
      <div className="border rounded-lg overflow-hidden pb-2 mb-6">
        <div className="min-h-[400px] p-4 space-y-3">
          {/* 에디터 툴바 스켈레톤 */}
          <div className="flex items-center gap-2 p-2 border-b">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>

          {/* 에디터 내용 스켈레톤 */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <div className="space-y-2 mt-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* 썸네일 업로드 스켈레톤 */}
      <div className="flex gap-4 mb-6">
        <div className="flex">
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="aspect-video h-32 rounded-lg" />
      </div>

      {/* 카테고리 입력 스켈레톤 */}
      <div className="mb-6">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="w-full h-10" />
      </div>

      {/* 태그 입력 스켈레톤 */}
      <div className="mb-6">
        <Skeleton className="h-4 w-12 mb-2" />
        <div className="space-y-2">
          <Skeleton className="w-full h-10" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-18 rounded-full" />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons 스켈레톤 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  )
}
