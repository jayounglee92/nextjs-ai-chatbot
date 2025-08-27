'use client'

import * as React from 'react'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { Button } from '@/components/tiptap-ui-primitive/button'
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button'
import { MinusIcon } from 'lucide-react'

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

  const handleClick = React.useCallback(() => {
    if (!editor) return

    // Insert a horizontal rule using the setHorizontalRule command
    editor.chain().focus().setHorizontalRule().run()
  }, [editor])

  if (!editor) return null

  return (
    <Button
      ref={ref}
      type="button"
      className="tiptap-button"
      onClick={handleClick}
      tooltip={tooltip}
      {...buttonProps}
    >
      <MinusIcon />
    </Button>
  )
})

HorizontalRuleButton.displayName = 'HorizontalRuleButton'
