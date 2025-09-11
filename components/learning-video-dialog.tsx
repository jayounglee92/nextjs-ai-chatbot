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
import type { LearningCenterDetailData } from './learning-list'
import { LearningListActions } from './learning-list-actions'
import { USER_TYPES } from '@/app/(auth)/auth'
import { useSession } from 'next-auth/react'

interface LearningVideoDialogProps {
  isOpen: boolean
  onClose: () => void
  learningItem: LearningCenterDetailData | null
}

export function LearningVideoDialog({
  isOpen,
  onClose,
  learningItem,
}: LearningVideoDialogProps) {
  const { data: session } = useSession()
  if (!learningItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 bg-background border-b p-4 lg:p-6 z-10">
          <div className="flex flex-col-reverse md:flex-row items-end md:items-start">
            <DialogTitle className="w-full flex flex-col gap-1 text-xl lg:text-2xl font-semibold break-keep text-left relative">
              {learningItem.category && (
                <span className="text-xs lg:text-sm text-muted-foreground">
                  {learningItem.category}
                </span>
              )}
              <span>{learningItem.title}</span>

              <div className="flex flex-wrap gap-1 mr-8 md:gap-2 mt-3">
                {learningItem.tags.length > 0 &&
                  learningItem.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
              </div>
              {session?.user.types.includes(USER_TYPES.AI_ADMIN) && (
                <LearningListActions
                  postId={learningItem.id}
                  onClose={onClose}
                  className="absolute -bottom-4 right-0 md:-right-7"
                />
              )}
            </DialogTitle>
            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="size-5 lg:size-6" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="p-4 lg:p-6 space-y-6">
          <SimpleEditor viewMode={true} initialContent={learningItem.content} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
