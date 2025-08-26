'use client'

import * as React from 'react'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { Button } from '@/components/tiptap-ui-primitive/button'
import { TableIcon } from '@/components/tiptap-icons/table-icon'
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button'

export interface TableButtonProps extends Omit<ButtonProps, 'type'> {
  /**
   * The Tiptap editor instance.
   */
  editor?: any
  /**
   * Optional tooltip text for the button.
   */
  tooltip?: string
}

/**
 * Button component for inserting tables in a Tiptap editor.
 */
export const TableButton = React.forwardRef<
  HTMLButtonElement,
  TableButtonProps
>(({ editor: providedEditor, tooltip = '테이블', ...buttonProps }, ref) => {
  const { editor } = useTiptapEditor(providedEditor)

  const handleClick = React.useCallback(() => {
    if (!editor) return

    // Insert a 3x3 table with header row by default
    editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
  }, [editor])

  if (!editor) return null

  return (
    <Button
      ref={ref}
      type="button"
      data-style="ghost"
      role="button"
      tabIndex={-1}
      onClick={handleClick}
      tooltip={tooltip}
      {...buttonProps}
    >
      <TableIcon className="tiptap-button-icon" />
    </Button>
  )
})

TableButton.displayName = 'TableButton'
