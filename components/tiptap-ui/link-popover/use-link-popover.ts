'use client'

import * as React from 'react'
import type { Editor } from '@tiptap/react'

// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'

// --- Icons ---
import { LinkIcon } from '@/components/tiptap-icons/link-icon'

// --- Lib ---
import { isMarkInSchema, sanitizeUrl } from '@/lib/tiptap-utils'

/**
 * Configuration for the link popover functionality
 */
export interface UseLinkPopoverConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether to hide the link popover when not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called when the link is set.
   */
  onSetLink?: () => void
}

/**
 * Configuration for the link handler functionality
 */
export interface LinkHandlerProps {
  /**
   * The Tiptap editor instance.
   */
  editor: Editor | null
  /**
   * Callback function called when the link is set.
   */
  onSetLink?: () => void
}

/**
 * Checks if a link can be set in the current editor state
 */
export function canSetLink(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  return editor.can().setMark('link')
}

/**
 * Checks if a link is currently active in the editor
 */
export function isLinkActive(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  return editor.isActive('link')
}

/**
 * Determines if the link button should be shown
 */
export function shouldShowLinkButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  const linkInSchema = isMarkInSchema('link', editor)

  if (!linkInSchema || !editor) {
    return false
  }

  if (hideWhenUnavailable && !editor.isActive('code')) {
    return canSetLink(editor)
  }

  return true
}

/**
 * Custom hook for handling link operations in a Tiptap editor
 */
export function useLinkHandler(props: LinkHandlerProps) {
  const { editor, onSetLink } = props
  const [url, setUrl] = React.useState<string | null>(null)
  const [openInNewTab, setOpenInNewTab] = React.useState<boolean>(false) // 기본값 false (_self)

  React.useEffect(() => {
    if (!editor) return

    // Get URL and target immediately on mount
    const { href, target } = editor.getAttributes('link')

    if (isLinkActive(editor) && url === null) {
      setUrl(href || '')
      setOpenInNewTab(target === '_blank')
    }
  }, [editor, url])

  React.useEffect(() => {
    if (!editor) return

    const updateLinkState = () => {
      const { href, target } = editor.getAttributes('link')
      setUrl(href || '')
      setOpenInNewTab(target === '_blank')
    }

    editor.on('selectionUpdate', updateLinkState)
    return () => {
      editor.off('selectionUpdate', updateLinkState)
    }
  }, [editor])

  const setLink = React.useCallback(() => {
    if (!url || !editor) return

    const { selection } = editor.state
    const isEmpty = selection.empty

    let chain = editor.chain().focus()

    const linkAttributes: { href: string; target: string } = {
      href: url,
      target: openInNewTab ? '_blank' : '_self',
    }

    chain = chain.extendMarkRange('link').setLink(linkAttributes)

    if (isEmpty) {
      chain = chain.insertContent({ type: 'text', text: url })
    }

    chain.run()

    setUrl(null)

    onSetLink?.()
  }, [editor, onSetLink, url, openInNewTab])

  const removeLink = React.useCallback(() => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .unsetLink()
      .setMeta('preventAutolink', true)
      .run()
    setUrl('')
  }, [editor])

  const openLink = React.useCallback(() => {
    if (!url) return

    const safeUrl = sanitizeUrl(url, window.location.href)
    if (safeUrl !== '#') {
      if (openInNewTab) {
        window.open(safeUrl, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = safeUrl
      }
    }
  }, [url, openInNewTab])

  return {
    url: url || '',
    setUrl,
    setLink,
    removeLink,
    openLink,
    openInNewTab,
    setOpenInNewTab,
  }
}

/**
 * Custom hook for link popover state management
 */
export function useLinkState(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}) {
  const { editor, hideWhenUnavailable = false } = props

  const canSet = canSetLink(editor)
  const isActive = isLinkActive(editor)

  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowLinkButton({
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
    canSet,
    isActive,
  }
}

/**
 * Main hook that provides link popover functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MyLinkButton() {
 *   const { isVisible, canSet, isActive, Icon, label } = useLinkPopover()
 *
 *   if (!isVisible) return null
 *
 *   return <button disabled={!canSet}>Link</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedLinkButton() {
 *   const { isVisible, canSet, isActive, Icon, label } = useLinkPopover({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onSetLink: () => console.log('Link set!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       disabled={!canSet}
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
export function useLinkPopover(config?: UseLinkPopoverConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onSetLink,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)

  const { isVisible, canSet, isActive } = useLinkState({
    editor,
    hideWhenUnavailable,
  })

  const linkHandler = useLinkHandler({
    editor,
    onSetLink,
  })

  return {
    isVisible,
    canSet,
    isActive,
    label: 'Link',
    Icon: LinkIcon,
    ...linkHandler,
  }
}
