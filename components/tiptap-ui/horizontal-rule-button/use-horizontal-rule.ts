'use client'

import * as React from 'react'
import type { Editor } from '@tiptap/react'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'

/**
 * Configuration for the horizontal rule functionality
 */
export interface UseHorizontalRuleConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when horizontal rule is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful horizontal rule insertion.
   */
  onInserted?: () => void
}

/**
 * Checks if horizontal rule can be inserted in the current editor state
 */
export function canInsertHorizontalRule(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  return editor.can().setHorizontalRule()
}

/**
 * Checks if horizontal rule is currently active (selected/focused)
 */
export function isHorizontalRuleActive(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  return editor.isActive('horizontalRule')
}

/**
 * Determines if the horizontal rule button should be shown
 */
export function shouldShowHorizontalRuleButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false

  if (hideWhenUnavailable) {
    return canInsertHorizontalRule(editor)
  }

  return true
}

/**
 * Inserts a horizontal rule in the editor
 */
export function insertHorizontalRule(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canInsertHorizontalRule(editor)) return false

  try {
    editor.chain().focus().setHorizontalRule().run()
    return true
  } catch {
    return false
  }
}

/**
 * Custom hook that provides horizontal rule functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MyHorizontalRuleButton() {
 *   const { isVisible, isActive, canInsert, handleInsert } = useHorizontalRule()
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <button
 *       onClick={handleInsert}
 *       aria-pressed={isActive}
 *       disabled={!canInsert}
 *     >
 *       Horizontal Rule
 *     </button>
 *   )
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedHorizontalRuleButton() {
 *   const { isVisible, isActive, canInsert, handleInsert } = useHorizontalRule({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onInserted: () => console.log('Horizontal rule inserted!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleInsert}
 *       aria-pressed={isActive}
 *       disabled={!canInsert}
 *     >
 *       Insert HR
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useHorizontalRule(config: UseHorizontalRuleConfig = {}) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
  } = config

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const canInsert = canInsertHorizontalRule(editor)
  const isActive = isHorizontalRuleActive(editor)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowHorizontalRuleButton({ editor, hideWhenUnavailable }),
      )
    }

    handleSelectionUpdate()

    editor.on('selectionUpdate', handleSelectionUpdate)

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleInsert = React.useCallback(() => {
    if (!editor) return false

    const success = insertHorizontalRule(editor)
    if (success) {
      onInserted?.()
    }
    return success
  }, [editor, onInserted])

  return {
    isVisible,
    isActive,
    handleInsert,
    canInsert,
    label: '수평선',
  }
}
