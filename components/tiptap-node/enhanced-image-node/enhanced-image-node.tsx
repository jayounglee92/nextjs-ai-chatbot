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
    // Popover 먼저 닫기
    setIsPopoverOpen(false)

    // NodeViewProps에서 노드를 삭제하는 방법
    if (props.deleteNode) {
      props.deleteNode()
    } else {
      // 대안: editor를 통해 직접 삭제
      const pos = props.getPos()
      if (typeof pos === 'number') {
        props.editor
          .chain()
          .focus()
          .deleteRange({
            from: pos,
            to: pos + props.node.nodeSize,
          })
          .run()
      }
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsPopoverOpen(true)
  }

  const handleDragStart = (e: React.DragEvent) => {
    // 드래그 시작 시 popover 닫기
    setIsPopoverOpen(false)

    // 드래그 데이터 설정
    const pos = props.getPos()
    if (typeof pos === 'number') {
      // 이미지 노드의 정확한 위치 정보 전달
      e.dataTransfer.setData('text/plain', pos.toString())
      e.dataTransfer.setData(
        'application/x-tiptap-image',
        JSON.stringify({
          pos,
          nodeSize: props.node.nodeSize,
          attrs: props.node.attrs,
        }),
      )
      e.dataTransfer.effectAllowed = 'move'
    }
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
          draggable={true}
          onDragStart={handleDragStart}
        />
      </ImagePopover>
    </NodeViewWrapper>
  )
}
