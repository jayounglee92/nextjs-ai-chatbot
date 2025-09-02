'use client'

import * as React from 'react'
import type { Editor } from '@tiptap/react'

// --- Hooks ---
import { useIsMobile } from '@/hooks/use-mobile'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'

// --- Icons ---
import { LinkIcon } from '@/components/tiptap-icons/link-icon'

// --- Tiptap UI ---
import type { UseLinkPopoverConfig } from '@/components/tiptap-ui/link-popover'
import { useLinkPopover } from '@/components/tiptap-ui/link-popover'

// --- UI Primitives ---
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button'
import { Button as TiptapButton } from '@/components/tiptap-ui-primitive/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/tiptap-ui-primitive/popover'
import {
  Card,
  CardBody,
  CardItemGroup,
} from '@/components/tiptap-ui-primitive/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputGroup } from '@/components/tiptap-ui-primitive/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

export interface LinkMainProps {
  /**
   * The URL to set for the link.
   */
  url: string
  /**
   * Function to update the URL state.
   */
  setUrl: React.Dispatch<React.SetStateAction<string | null>>
  /**
   * Function to set the link in the editor.
   */
  setLink: () => void
  /**
   * Function to remove the link from the editor.
   */
  removeLink: () => void
  /**
   * Function to open the link.
   */
  openLink: () => void
  /**
   * Whether the link is currently active in the editor.
   */
  isActive: boolean
  /**
   * Whether the link should open in a new tab.
   */
  openInNewTab: boolean
  /**
   * Function to update the openInNewTab state.
   */
  setOpenInNewTab: React.Dispatch<React.SetStateAction<boolean>>
}

export interface LinkPopoverProps
  extends Omit<ButtonProps, 'type'>,
    UseLinkPopoverConfig {
  /**
   * Callback for when the popover opens or closes.
   */
  onOpenChange?: (isOpen: boolean) => void
  /**
   * Whether to automatically open the popover when a link is active.
   * @default true
   */
  autoOpenOnLinkActive?: boolean
}

/**
 * Link button component for triggering the link popover
 */
export const LinkButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <TiptapButton
        type="button"
        className={className}
        data-style="ghost"
        role="button"
        tabIndex={-1}
        aria-label="Link"
        tooltip="링크"
        ref={ref}
        {...props}
      >
        {children || <LinkIcon className="tiptap-button-icon" />}
      </TiptapButton>
    )
  },
)

LinkButton.displayName = 'LinkButton'

/**
 * Main content component for the link popover
 */
const LinkMain: React.FC<LinkMainProps> = ({
  url,
  setUrl,
  setLink,
  removeLink,
  openLink,
  isActive,
  openInNewTab,
  setOpenInNewTab,
}) => {
  const isMobile = useIsMobile()

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      setLink()
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setOpenInNewTab(checked)
  }

  return (
    <Card className={isMobile ? 'shadow-none border-0' : ''}>
      <CardBody className={`space-y-2 ${isMobile ? 'p-0' : ''}`}>
        <CardItemGroup orientation="horizontal">
          {/* URL 입력 필드 */}

          <InputGroup>
            <Input
              id="link-url"
              type="url"
              placeholder="링크를 입력하세요"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              className="w-full min-w-[260px]"
            />
          </InputGroup>
        </CardItemGroup>

        <CardItemGroup orientation="horizontal">
          <div className="flex items-center space-x-2 mr-auto">
            <Checkbox
              id="open-in-new-tab"
              checked={openInNewTab}
              onCheckedChange={(checked: boolean) =>
                handleCheckboxChange(checked)
              }
            />
            <Label htmlFor="open-in-new-tab">새 창에서 열기</Label>
          </div>
          <Button
            type="button"
            onClick={setLink}
            title="저장하기"
            disabled={!url && !isActive}
            size="sm"
          >
            저장
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={removeLink}
            title="링크 제거"
            disabled={!url && !isActive}
            size="sm"
          >
            제거
          </Button>
        </CardItemGroup>
      </CardBody>
    </Card>
  )
}

/**
 * Link content component for standalone use
 */
export const LinkContent: React.FC<{
  editor?: Editor | null
}> = ({ editor }) => {
  const linkPopover = useLinkPopover({
    editor,
  })

  return <LinkMain {...linkPopover} />
}

/**
 * Link popover component for Tiptap editors.
 *
 * For custom popover implementations, use the `useLinkPopover` hook instead.
 */
export const LinkPopover = React.forwardRef<
  HTMLButtonElement,
  LinkPopoverProps
>(
  (
    {
      editor: providedEditor,
      hideWhenUnavailable = false,
      onSetLink,
      onOpenChange,
      autoOpenOnLinkActive = true,
      onClick,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const [isOpen, setIsOpen] = React.useState(false)

    const {
      isVisible,
      canSet,
      isActive,
      url,
      setUrl,
      setLink,
      removeLink,
      openLink,
      openInNewTab,
      setOpenInNewTab,
      label,
      Icon,
    } = useLinkPopover({
      editor,
      hideWhenUnavailable,
      onSetLink,
    })

    const handleOnOpenChange = React.useCallback(
      (nextIsOpen: boolean) => {
        setIsOpen(nextIsOpen)
        onOpenChange?.(nextIsOpen)
      },
      [onOpenChange],
    )

    const handleSetLink = React.useCallback(() => {
      setLink()
      setIsOpen(false)
    }, [setLink])

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        setIsOpen(!isOpen)
      },
      [onClick, isOpen],
    )

    React.useEffect(() => {
      if (autoOpenOnLinkActive && isActive) {
        setIsOpen(true)
      }
    }, [autoOpenOnLinkActive, isActive])

    if (!isVisible) {
      return null
    }

    return (
      <Popover open={isOpen} onOpenChange={handleOnOpenChange}>
        <PopoverTrigger asChild>
          <LinkButton
            disabled={!canSet}
            data-active-state={isActive ? 'on' : 'off'}
            data-disabled={!canSet}
            aria-label={label}
            aria-pressed={isActive}
            onClick={handleClick}
            {...buttonProps}
            ref={ref}
          >
            {children ?? <Icon className="tiptap-button-icon" />}
          </LinkButton>
        </PopoverTrigger>

        <PopoverContent>
          <LinkMain
            url={url}
            setUrl={setUrl}
            setLink={handleSetLink}
            removeLink={removeLink}
            openLink={openLink}
            isActive={isActive}
            openInNewTab={openInNewTab}
            setOpenInNewTab={setOpenInNewTab}
          />
        </PopoverContent>
      </Popover>
    )
  },
)

LinkPopover.displayName = 'LinkPopover'

export default LinkPopover
