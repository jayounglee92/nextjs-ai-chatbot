'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import type { LearningItem } from '@/lib/data/learning-center'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface LearningVideoDialogProps {
  isOpen: boolean
  onClose: () => void
  learningItem: LearningItem | null
}

export function LearningVideoDialog({
  isOpen,
  onClose,
  learningItem,
}: LearningVideoDialogProps) {
  if (!learningItem) return null

  // YouTube 비디오 ID (실제로는 learningItem에 videoId 필드가 있어야 함)
  // 임시로 하드코딩된 비디오 ID 사용
  const videoId = learningItem.videoId

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 bg-background border-b p-4 lg:p-6 z-10">
          <div className="flex flex-col-reverse md:flex-row items-end md:items-center">
            <DialogTitle className="w-full text-lg lg:text-xl font-semibold break-keep text-left">
              {learningItem.title}
            </DialogTitle>
            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="size-5 lg:size-6" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="p-4 lg:p-6 space-y-6">
          {/* YouTube 비디오 */}
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={learningItem.title}
              className="size-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* 비디오 정보 */}
          <div className="space-y-4">
            {/* 설명 */}
            <div>
              <h3 className="font-semibold mb-2 text-sm lg:text-base">설명</h3>
              <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                {learningItem.description}
              </p>
            </div>

            {/* 카테고리 및 태그 */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2 text-sm lg:text-base">
                  카테고리
                </h3>
                <Badge variant="secondary">{learningItem.category}</Badge>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-sm lg:text-base">
                  태그
                </h3>
                <div className="flex flex-wrap gap-2">
                  {learningItem.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
