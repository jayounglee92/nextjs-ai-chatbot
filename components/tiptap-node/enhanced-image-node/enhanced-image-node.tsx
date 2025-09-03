'use client'

import * as React from 'react'
import Image from 'next/image'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import {
  ImagePopover,
  type ImageAlignment,
} from '@/components/tiptap-ui/image-popover'
import '@/components/tiptap-ui/image-popover/image-popover.scss'
import './enhanced-image-node.scss'
import { useThrottledCallback } from '@/hooks/use-throttled-callback'

export const EnhancedImageNode: React.FC<NodeViewProps> = (props) => {
  const { src, alt, title, alignment, width, height } = props.node.attrs
  const { updateAttributes, editor, deleteNode, getPos, node } = props
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)
  const [resizeHandle, setResizeHandle] = React.useState<string | null>(null)
  const imageRef = React.useRef<HTMLImageElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // 에디터가 뷰 모드인지 확인
  const isViewMode = !editor.isEditable

  const handleAlignmentChange = (newAlignment: ImageAlignment) => {
    if (updateAttributes) {
      updateAttributes({ alignment: newAlignment })
    }
  }

  const handleResize = React.useCallback(
    (newWidth: number, newHeight: number) => {
      if (updateAttributes) {
        updateAttributes({
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        })
      }
    },
    [updateAttributes],
  )

  // throttle된 리사이즈 핸들러 (60fps로 제한)
  const throttledHandleResize = useThrottledCallback(
    handleResize,
    16, // 16ms = 60fps
    [updateAttributes],
    { leading: false, trailing: true },
  )

  const handleResetSize = React.useCallback(() => {
    if (updateAttributes) {
      updateAttributes({ width: null, height: null })
    }
  }, [updateAttributes])

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      setResizeHandle(handle)
      setIsPopoverOpen(false) // 리사이즈 중에는 팝오버 닫기

      const startX = e.clientX
      const startY = e.clientY
      const startWidth = width || imageRef.current?.naturalWidth || 0
      const startHeight = height || imageRef.current?.naturalHeight || 0
      const aspectRatio = startWidth / startHeight

      // ProseMirror-selectednode의 최대 너비 가져오기 : 이미지는 에디터 너비보다 클 수 없음
      const getMaxWidth = () => {
        // ProseMirror-selectednode 클래스를 가진 요소 찾기
        const proseMirrorNode = document.querySelector(
          '.ProseMirror-selectednode',
        )
        if (proseMirrorNode) {
          return proseMirrorNode.getBoundingClientRect().width
        }
        // 대안: containerRef 사용
        if (containerRef.current) {
          return containerRef.current.offsetWidth
        }
        return 800 // 기본값
      }

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX
        const deltaY = e.clientY - startY
        const maxWidth = getMaxWidth()

        let newWidth = startWidth
        let newHeight = startHeight

        switch (handle) {
          case 'se': // 우하단
            newWidth = Math.max(50, Math.min(maxWidth, startWidth + deltaX))
            newHeight = Math.max(50, newWidth / aspectRatio)
            break
          case 'sw': // 좌하단
            newWidth = Math.max(50, Math.min(maxWidth, startWidth - deltaX))
            newHeight = Math.max(50, newWidth / aspectRatio)
            break
          case 'ne': // 우상단
            newWidth = Math.max(50, Math.min(maxWidth, startWidth + deltaX))
            newHeight = Math.max(50, newWidth / aspectRatio)
            break
          case 'nw': // 좌상단
            newWidth = Math.max(50, Math.min(maxWidth, startWidth - deltaX))
            newHeight = Math.max(50, newWidth / aspectRatio)
            break
        }

        throttledHandleResize(newWidth, newHeight)
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        setResizeHandle(null)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      // passive: false로 설정하여 preventDefault 사용 가능하게 함
      document.addEventListener('mousemove', handleMouseMove, {
        passive: false,
      })
      document.addEventListener('mouseup', handleMouseUp, { passive: true })
    },
    [width, height, throttledHandleResize],
  )

  const handleDelete = () => {
    // Popover 먼저 닫기
    setIsPopoverOpen(false)

    // NodeViewProps에서 노드를 삭제하는 방법
    if (deleteNode) {
      deleteNode()
    } else {
      // 대안: editor를 통해 직접 삭제
      const pos = getPos()
      if (typeof pos === 'number') {
        editor
          .chain()
          .focus()
          .deleteRange({
            from: pos,
            to: pos + node.nodeSize,
          })
          .run()
      }
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // 뷰 모드에서는 팝오버 비활성화
    if (!isResizing && !isViewMode) {
      setIsPopoverOpen(true)
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    // 뷰 모드에서는 드래그 비활성화
    if (isViewMode) {
      e.preventDefault()
      return
    }

    // 드래그 시작 시 popover 닫기
    setIsPopoverOpen(false)

    // 드래그 데이터 설정
    const pos = getPos()
    if (typeof pos === 'number') {
      // 이미지 노드의 정확한 위치 정보 전달
      e.dataTransfer.setData('text/plain', pos.toString())
      e.dataTransfer.setData(
        'application/x-tiptap-image',
        JSON.stringify({
          pos,
          nodeSize: node.nodeSize,
          attrs: node.attrs,
        }),
      )
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  const imageStyle: React.CSSProperties = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
  }

  return (
    <NodeViewWrapper
      ref={containerRef}
      className={`enhanced-image-wrapper enhanced-image-${alignment} ${isResizing ? 'resizing' : ''}`}
      data-alignment={alignment}
    >
      {/* 뷰 모드에서는 ImagePopover와 리사이즈 핸들 제거 */}
      {!isViewMode ? (
        <ImagePopover
          editor={editor}
          open={isPopoverOpen && !isResizing}
          onOpenChange={setIsPopoverOpen}
          alignment={alignment}
          onAlignmentChange={handleAlignmentChange}
          onDelete={handleDelete}
          onResetSize={handleResetSize}
          width={width}
          height={height}
        >
          <div
            className="enhanced-image-container"
            data-state={isPopoverOpen ? 'open' : 'closed'}
          >
            <Image
              ref={imageRef}
              src={src}
              alt={alt || ''}
              title={title || ''}
              className={`enhanced-image ${width === null ? 'w-full h-auto' : ''}`}
              style={imageStyle}
              onClick={handleImageClick}
              draggable={!isResizing}
              onDragStart={handleDragStart}
              width={width === null ? 400 : width}
              height={height === null ? 300 : height}
              unoptimized
            />

            {/* 리사이즈 핸들들 - 모서리 4개만 */}
            <div className="resize-handles">
              <button
                type="button"
                className="resize-handle resize-handle-nw"
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
                aria-label="좌상단 리사이즈"
              />
              <button
                type="button"
                className="resize-handle resize-handle-ne"
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
                aria-label="우상단 리사이즈"
              />
              <button
                type="button"
                className="resize-handle resize-handle-sw"
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
                aria-label="좌하단 리사이즈"
              />
              <button
                type="button"
                className="resize-handle resize-handle-se"
                onMouseDown={(e) => handleMouseDown(e, 'se')}
                aria-label="우하단 리사이즈"
              />
            </div>
          </div>
        </ImagePopover>
      ) : (
        /* 뷰 모드: 단순한 이미지만 표시 */
        <div className="enhanced-image-container enhanced-image-viewmode">
          <Image
            ref={imageRef}
            src={src}
            alt={alt || ''}
            title={title || ''}
            className={`enhanced-image ${width === null ? 'w-full h-auto' : ''}`}
            style={imageStyle}
            draggable={false}
            width={width === null ? 400 : width}
            height={height === null ? 300 : height}
            unoptimized
          />
        </div>
      )}
    </NodeViewWrapper>
  )
}
