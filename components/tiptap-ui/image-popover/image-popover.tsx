'use client'

import * as React from 'react'
import type { Editor } from '@tiptap/react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/tiptap-ui-primitive/popover'
import { Button } from '@/components/tiptap-ui-primitive/button'
import { AlignLeft, AlignCenter, AlignRight, X } from 'lucide-react'
import { useImage } from './use-image'

export type ImageAlignment = 'left' | 'center' | 'right'

interface ImagePopoverProps {
  /**
   * The editor instance
   */
  editor: Editor | null
  /**
   * Whether the popover is open
   */
  open: boolean
  /**
   * Callback to handle open state changes
   */
  onOpenChange: (open: boolean) => void
  /**
   * Current alignment value (fallback if editor is not available)
   */
  alignment?: ImageAlignment
  /**
   * Callback when alignment is changed (fallback if editor is not available)
   */
  onAlignmentChange?: (alignment: ImageAlignment) => void
  /**
   * Callback when delete is clicked (fallback if editor is not available)
   */
  onDelete?: () => void
  /**
   * Trigger element for the popover
   */
  children: React.ReactNode
}

const alignmentOptions: Array<{
  value: ImageAlignment
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}> = [
  {
    value: 'left',
    label: '왼쪽 정렬',
    icon: AlignLeft,
  },
  {
    value: 'center',
    label: '가운데 정렬',
    icon: AlignCenter,
  },
  {
    value: 'right',
    label: '오른쪽 정렬',
    icon: AlignRight,
  },
]

export const ImagePopover: React.FC<ImagePopoverProps> = ({
  editor,
  open,
  onOpenChange,
  alignment: fallbackAlignment,
  onAlignmentChange: fallbackOnAlignmentChange,
  onDelete: fallbackOnDelete,
  children,
}) => {
  const {
    isVisible,
    canChangeAlignment,
    isImageSelected,
    currentAlignment,
    isAlignmentActive,
    setAlignment,
    deleteImage,
  } = useImage({ editor })

  // Use editor-based values when available, otherwise fallback to props
  const alignment = editor ? currentAlignment : fallbackAlignment || 'center'
  const onAlignmentChange = editor ? setAlignment : fallbackOnAlignmentChange
  const onDelete = editor ? deleteImage : fallbackOnDelete

  const handleClick = React.useCallback(
    (value: ImageAlignment) => {
      onAlignmentChange?.(value)
    },
    [onAlignmentChange],
  )
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="tiptap-image-popover"
        side="top"
        align="center"
      >
        <div className="tiptap-image-popover-content">
          <div className="tiptap-image-alignment-options">
            {alignmentOptions.map((option) => {
              const Icon = option.icon
              const isActive = editor
                ? isAlignmentActive(option.value)
                : alignment === option.value
              const canToggle = editor ? canChangeAlignment : true

              return (
                <Button
                  key={option.value}
                  type="button"
                  data-style="ghost"
                  data-active-state={isActive ? 'on' : 'off'}
                  role="button"
                  tabIndex={-1}
                  disabled={!canToggle}
                  data-disabled={!canToggle}
                  aria-pressed={isActive}
                  tooltip={option.label}
                  title={option.label}
                  onClick={() => handleClick(option.value)}
                  className="tiptap-image-alignment-button"
                >
                  <Icon className="tiptap-button-icon" />
                </Button>
              )
            })}
          </div>
          <div className="tiptap-image-popover-separator" />
          <div className="tiptap-image-delete-section">
            <Button
              type="button"
              data-style="ghost"
              data-size="sm"
              onClick={() => {
                onDelete?.()
              }}
              title="이미지 삭제"
              className="tiptap-image-delete-button"
            >
              <X className="tiptap-button-icon" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
