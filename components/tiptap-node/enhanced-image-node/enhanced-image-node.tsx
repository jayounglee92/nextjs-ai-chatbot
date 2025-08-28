'use client'

import * as React from 'react'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import {
  ImagePopover,
  type ImageAlignment,
} from '@/components/tiptap-ui/image-popover'
import '@/components/tiptap-ui/image-popover/image-popover.scss'
import './enhanced-image-node.scss'

export const EnhancedImageNode: React.FC<NodeViewProps> = (props) => {
  const { src, alt, title, alignment } = props.node.attrs
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

  const handleAlignmentChange = (newAlignment: ImageAlignment) => {
    if (props.updateAttributes) {
      props.updateAttributes({ alignment: newAlignment })
    }
  }

  const handleDelete = () => {
    if (props.deleteNode) {
      props.deleteNode()
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsPopoverOpen(true)
  }

  return (
    <NodeViewWrapper
      className={`enhanced-image-wrapper enhanced-image-${alignment}`}
      data-alignment={alignment}
    >
      <ImagePopover
        editor={props.editor}
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        alignment={alignment}
        onAlignmentChange={handleAlignmentChange}
        onDelete={handleDelete}
      >
        <img
          src={src}
          alt={alt || ''}
          title={title || ''}
          className="enhanced-image"
          onClick={handleImageClick}
          draggable={false}
        />
      </ImagePopover>
    </NodeViewWrapper>
  )
}
