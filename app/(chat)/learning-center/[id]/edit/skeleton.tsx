import { Skeleton } from '@/components/ui/skeleton'

export function LearningCenterEditSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb 스켈레톤 */}
      <nav className="flex items-center space-x-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="size-4" />
        <Skeleton className="h-4 w-20" />
      </nav>

      {/* 제목 입력 필드 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* 설명 입력 필드 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* 카테고리 선택 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* 비디오 ID 입력 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />

        {/* 비디오 미리보기 스켈레톤 */}
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="aspect-video w-full max-w-md border border-gray-200 rounded-lg overflow-hidden">
            <Skeleton className="size-full" />
          </div>
          {/* 비디오 정보 영역 스켈레톤 */}
          <div className="h-12 flex items-center">
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>

      {/* 태그 입력 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-8" />
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-16" />
        </div>
        {/* 태그 뱃지들 스켈레톤 */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>

      {/* 썸네일 업로드 스켈레톤 */}
      <div className="w-fit space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="aspect-video w-80 h-45 rounded-lg" />
      </div>

      {/* Fixed Bottom Buttons 스켈레톤 */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t p-4">
        <div className="max-w-4xl mx-auto flex justify-end gap-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  )
}
