'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import type { LearningCenter } from '@/lib/db/schema'

// API에서 받는 데이터 타입 (tags가 배열로 변환됨)
interface ClientLearningCenter extends Omit<LearningCenter, 'tags'> {
  tags: string[]
}
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import {
  getYouTubeEmbedUrl,
  isValidYouTubeVideoIdFormat,
} from '@/lib/youtube-utils'

interface LearningVideoDialogProps {
  isOpen: boolean
  onClose: () => void
  learningItem: ClientLearningCenter | null
}

export function LearningVideoDialog({
  isOpen,
  onClose,
  learningItem,
}: LearningVideoDialogProps) {
  if (!learningItem) return null

  // YouTube 비디오 ID 검증 및 임베드 URL 생성
  const videoId = learningItem.videoId
  const isValidVideoId = isValidYouTubeVideoIdFormat(videoId)
  const embedUrl = isValidVideoId ? getYouTubeEmbedUrl(videoId) : ''

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
            {isValidVideoId && embedUrl ? (
              <iframe
                src={embedUrl}
                title={learningItem.title}
                className="size-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="size-full rounded-lg bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-lg font-medium">
                    비디오를 불러올 수 없습니다
                  </p>
                  <p className="text-sm mt-1">
                    올바른 YouTube 비디오 ID인지 확인해주세요
                  </p>
                  <p className="text-xs mt-2 text-gray-400">
                    비디오 ID: {videoId}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 비디오 정보 */}
          <div className="space-y-6">
            {/* 설명 */}
            <div className="space-y-1">
              <h3 className="font-semibold text-sm lg:text-base">설명</h3>
              <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                {learningItem.description}
              </p>
            </div>

            {/* 카테고리 및 태그 */}

            <div className="space-y-1">
              <h3 className="font-semibold text-sm lg:text-base">카테고리</h3>
              <Badge variant="secondary">{learningItem.category}</Badge>
            </div>

            {learningItem.tags.length > 0 && (
              <div className="space-y-1">
                <h3 className="font-semibold text-sm lg:text-base">태그</h3>
                <div className="flex flex-wrap gap-2">
                  {learningItem.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
