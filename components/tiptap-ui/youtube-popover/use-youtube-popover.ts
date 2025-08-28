'use client'

import * as React from 'react'
import type { Editor } from '@tiptap/react'

// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'

// --- Icons ---
import { YoutubeIcon } from '@/components/tiptap-icons/youtube-icon'

/**
 * Configuration for the YouTube popover functionality
 */
export interface UseYoutubePopoverConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether to hide the YouTube popover when not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called when the YouTube video is inserted.
   */
  onInsertVideo?: () => void
}

/**
 * Configuration for the YouTube handler functionality
 */
export interface YoutubeHandlerProps {
  /**
   * The Tiptap editor instance.
   */
  editor: Editor | null
  /**
   * Callback function called when the YouTube video is inserted.
   */
  onInsertVideo?: () => void
}

/**
 * Checks if a YouTube video can be inserted in the current editor state
 */
export function canInsertYoutube(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  // YouTube 확장이 사용 가능한지 확인
  return editor.extensionManager.extensions.some(
    (ext) => ext.name === 'youtube',
  )
}

/**
 * Checks if a YouTube video is currently active in the editor
 */
export function isYoutubeActive(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  return editor.isActive('youtube')
}

/**
 * Determines if the YouTube button should be shown
 */
export function shouldShowYoutubeButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor) {
    return false
  }

  // YouTube 확장이 설치되어 있는지 확인
  const hasYoutubeExtension = editor.extensionManager.extensions.some(
    (ext) => ext.name === 'youtube',
  )

  if (!hasYoutubeExtension) {
    return false
  }

  if (hideWhenUnavailable) {
    return canInsertYoutube(editor)
  }

  return true
}

/**
 * Custom hook for handling YouTube operations in a Tiptap editor
 */
export function useYoutubeHandler(props: YoutubeHandlerProps) {
  const { editor, onInsertVideo } = props
  const [url, setUrl] = React.useState<string>('')
  const [width, setWidth] = React.useState<number>(640)
  const [height, setHeight] = React.useState<number>(480)

  React.useEffect(() => {
    if (!editor) return

    const updateYoutubeState = () => {
      if (isYoutubeActive(editor)) {
        const attrs = editor.getAttributes('youtube')
        setUrl(attrs.src || '')
        setWidth(attrs.width || 640)
        setHeight(attrs.height || 480)
      } else {
        setUrl('')
        setWidth(640)
        setHeight(480)
      }
    }

    editor.on('selectionUpdate', updateYoutubeState)
    return () => {
      editor.off('selectionUpdate', updateYoutubeState)
    }
  }, [editor])

  const insertVideo = React.useCallback(() => {
    if (!url || !editor) return

    try {
      editor
        .chain()
        .focus()
        .setYoutubeVideo({
          src: url,
          width,
          height,
        })
        .run()

      // 성공 후 상태 초기화
      setUrl('')
      setWidth(640)
      setHeight(480)

      onInsertVideo?.()
    } catch (error) {
      console.error('YouTube 비디오 삽입 실패:', error)
    }
  }, [editor, onInsertVideo, url, width, height])

  const removeVideo = React.useCallback(() => {
    if (!editor) return

    if (isYoutubeActive(editor)) {
      editor.chain().focus().deleteSelection().run()
    }

    setUrl('')
    setWidth(640)
    setHeight(480)
  }, [editor])

  const openVideo = React.useCallback(() => {
    if (!url) return

    // YouTube URL을 새 탭에서 열기
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [url])

  return {
    url,
    setUrl,
    width,
    setWidth,
    height,
    setHeight,
    insertVideo,
    removeVideo,
    openVideo,
  }
}

/**
 * Custom hook for YouTube popover state management
 */
export function useYoutubeState(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}) {
  const { editor, hideWhenUnavailable = false } = props

  const canInsert = canInsertYoutube(editor)
  const isActive = isYoutubeActive(editor)

  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowYoutubeButton({
          editor,
          hideWhenUnavailable,
        }),
      )
    }

    handleSelectionUpdate()

    editor.on('selectionUpdate', handleSelectionUpdate)

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  return {
    isVisible,
    canInsert,
    isActive,
  }
}

/**
 * Main hook that provides YouTube popover functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MyYoutubeButton() {
 *   const { isVisible, canInsert, isActive, Icon, label } = useYoutubePopover()
 *
 *   if (!isVisible) return null
 *
 *   return <button disabled={!canInsert}>YouTube</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedYoutubeButton() {
 *   const { isVisible, canInsert, isActive, Icon, label } = useYoutubePopover({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onInsertVideo: () => console.log('YouTube video inserted!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       disabled={!canInsert}
 *       aria-label={label}
 *       aria-pressed={isActive}
 *     >
 *       <Icon />
 *       {label}
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useYoutubePopover(config?: UseYoutubePopoverConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInsertVideo,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)

  const { isVisible, canInsert, isActive } = useYoutubeState({
    editor,
    hideWhenUnavailable,
  })

  const youtubeHandler = useYoutubeHandler({
    editor,
    onInsertVideo,
  })

  return {
    isVisible,
    canInsert,
    isActive,
    label: 'YouTube',
    Icon: YoutubeIcon,
    ...youtubeHandler,
  }
}
