import * as React from 'react'
import type { Editor } from '@tiptap/react'
import type { ImageAlignment } from './image-popover'

export interface UseImageConfig {
  /**
   * The editor instance.
   */
  editor: Editor | null
  /**
   * Hide the button when it's not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback when image alignment is changed.
   */
  onAlignmentChanged?: (alignment: ImageAlignment) => void
}

export interface UseImageReturn {
  /**
   * Whether the image node is available in the editor.
   */
  isVisible: boolean
  /**
   * Whether the image alignment can be changed.
   */
  canChangeAlignment: boolean
  /**
   * Whether an image is currently selected.
   */
  isImageSelected: boolean
  /**
   * Current alignment of the selected image.
   */
  currentAlignment: ImageAlignment
  /**
   * Check if a specific alignment is active.
   */
  isAlignmentActive: (alignment: ImageAlignment) => boolean
  /**
   * Set image alignment.
   */
  setAlignment: (alignment: ImageAlignment) => void
  /**
   * Delete the selected image.
   */
  deleteImage: () => void
}

/**
 * Hook for managing image alignment in a Tiptap editor.
 */
export function useImage({
  editor,
  hideWhenUnavailable = false,
  onAlignmentChanged,
}: UseImageConfig): UseImageReturn {
  const isVisible = React.useMemo(() => {
    if (!editor) return false
    if (hideWhenUnavailable && !editor.can().setImageAlignment('left')) {
      return false
    }
    return true
  }, [editor, hideWhenUnavailable])

  const canChangeAlignment = React.useMemo(() => {
    if (!editor) return false
    return editor.can().setImageAlignment('left')
  }, [editor])

  const isImageSelected = React.useMemo(() => {
    if (!editor) return false
    return editor.isActive('image')
  }, [editor])

  const [currentAlignment, setCurrentAlignment] =
    React.useState<ImageAlignment>('center')

  // Update current alignment when editor state changes
  React.useEffect(() => {
    if (!editor) return

    const updateAlignment = () => {
      if (!editor.isActive('image')) {
        return
      }

      const { selection } = editor.state
      const { $from } = selection

      // Check if there's a selected image node
      if (
        selection instanceof editor.state.selection.constructor &&
        'node' in selection
      ) {
        const selectedNode = (selection as any).node
        if (selectedNode && selectedNode.type.name === 'image') {
          const newAlignment = selectedNode.attrs.alignment || 'center'
          setCurrentAlignment(newAlignment)
          return
        }
      }

      // Check if we're inside an image node
      let currentNode = $from.node()
      let depth = $from.depth

      while (depth >= 0) {
        if (currentNode.type.name === 'image') {
          const newAlignment = currentNode.attrs.alignment || 'center'
          setCurrentAlignment(newAlignment)
          return
        }
        depth--
        if (depth >= 0) {
          currentNode = $from.node(depth)
        }
      }
    }

    // Initial update
    updateAlignment()

    // Listen to editor updates
    editor.on('selectionUpdate', updateAlignment)
    editor.on('transaction', updateAlignment)

    return () => {
      editor.off('selectionUpdate', updateAlignment)
      editor.off('transaction', updateAlignment)
    }
  }, [editor])

  const isAlignmentActive = React.useCallback(
    (alignment: ImageAlignment) => {
      return currentAlignment === alignment
    },
    [currentAlignment],
  )

  const setAlignment = React.useCallback(
    (alignment: ImageAlignment) => {
      if (!editor || !canChangeAlignment) return

      editor.commands.setImageAlignment(alignment)
      setCurrentAlignment(alignment) // 즉시 상태 업데이트
      onAlignmentChanged?.(alignment)
    },
    [editor, canChangeAlignment, onAlignmentChanged],
  )

  const deleteImage = React.useCallback(() => {
    if (!editor) return

    // 현재 선택된 노드가 이미지인지 확인
    const { selection } = editor.state
    const selectedNode = 'node' in selection ? (selection as any).node : null

    if (selectedNode && selectedNode.type.name === 'image') {
      // 선택된 이미지 노드 삭제
      editor.commands.deleteSelection()
    } else if (editor.isActive('image')) {
      // 이미지가 활성화되어 있지만 선택되지 않은 경우
      editor.commands.deleteSelection()
    } else {
      // 대안: 현재 위치에서 이미지 노드 찾아서 삭제
      const { $from } = selection
      let depth = $from.depth

      while (depth >= 0) {
        const node = $from.node(depth)
        if (node.type.name === 'image') {
          const pos = $from.before(depth)
          editor
            .chain()
            .focus()
            .deleteRange({
              from: pos,
              to: pos + node.nodeSize,
            })
            .run()
          return
        }
        depth--
      }
    }
  }, [editor])

  return {
    isVisible,
    canChangeAlignment,
    isImageSelected,
    currentAlignment,
    isAlignmentActive,
    setAlignment,
    deleteImage,
  }
}
