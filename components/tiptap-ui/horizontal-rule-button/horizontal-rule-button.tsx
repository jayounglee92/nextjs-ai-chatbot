'use client'

import * as React from 'react'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { Button } from '@/components/tiptap-ui-primitive/button'
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button'
import { MinusIcon } from 'lucide-react'
import { useHorizontalRule } from './use-horizontal-rule'

export interface HorizontalRuleButtonProps extends Omit<ButtonProps, 'type'> {
  /**
   * Optional tooltip text for the button.
   */
  tooltip?: string
}

/**
 * Button component for inserting horizontal rules in a Tiptap editor.
 */
export const HorizontalRuleButton = React.forwardRef<
  HTMLButtonElement,
  HorizontalRuleButtonProps
>(({ tooltip = '수평선', ...buttonProps }, ref) => {
  const { editor } = useTiptapEditor()
  const { label, isActive, handleInsert, canInsert } = useHorizontalRule({
    editor,
  })

  if (!editor) return null

  return (
    <Button
      ref={ref}
      type="button"
      data-style="ghost"
      role="button"
      tabIndex={-1}
      aria-label={label}
      aria-pressed={isActive}
      tooltip={label}
      onClick={handleInsert}
      disabled={!canInsert}
      data-disabled={!canInsert}
      data-active-state={isActive ? 'on' : 'off'}
      {...buttonProps}
    >
      <MinusIcon className="tiptap-button-icon" />
    </Button>
  )
})

HorizontalRuleButton.displayName = 'HorizontalRuleButton'
