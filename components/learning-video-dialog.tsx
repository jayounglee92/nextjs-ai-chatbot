'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { SimpleEditor } from './tiptap-templates/simple/simple-editor'

interface PostDetailData {
  id: string
  postId: string
  content: string
  category: string | null
  tags: string[]
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  userEmail: string
  readingTime: number
}
interface LearningVideoDialogProps {
  isOpen: boolean
  onClose: () => void
  learningItem: PostDetailData
}

export function LearningVideoDialog({
  isOpen,
  onClose,
  learningItem,
}: LearningVideoDialogProps) {
  if (!learningItem) return null

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
          {/* 비디오 정보 */}
          <div className="space-y-6">
            {/* 카테고리 및 태그 */}
            <SimpleEditor
              viewMode={true}
              initialContent={learningItem.content}
            />

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
