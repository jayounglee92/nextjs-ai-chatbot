'use client'

import * as React from 'react'
import type { Editor } from '@tiptap/react'

// --- Hooks ---
import { useIsMobile } from '@/hooks/use-mobile'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'

// --- Icons ---
import { CornerDownLeftIcon } from '@/components/tiptap-icons/corner-down-left-icon'
import { ExternalLinkIcon } from '@/components/tiptap-icons/external-link-icon'
import { YoutubeIcon } from '@/components/tiptap-icons/youtube-icon'
import { TrashIcon } from '@/components/tiptap-icons/trash-icon'

// --- Tiptap UI ---
import type { UseYoutubePopoverConfig } from '@/components/tiptap-ui/youtube-popover'
import { useYoutubePopover } from '@/components/tiptap-ui/youtube-popover'

// --- UI Primitives ---
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button'
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/tiptap-ui-primitive/popover'
import { Separator } from '@/components/tiptap-ui-primitive/separator'
import {
  Card,
  CardBody,
  CardItemGroup,
} from '@/components/tiptap-ui-primitive/card'
import { Input, InputGroup } from '@/components/tiptap-ui-primitive/input'

export interface YoutubeMainProps {
  /**
   * The YouTube URL to set for the video.
   */
  url: string
  /**
   * Function to update the URL state.
   */
  setUrl: React.Dispatch<React.SetStateAction<string>>
  /**
   * Video width
   */
  width: number
  /**
   * Function to update the width state.
   */
  setWidth: React.Dispatch<React.SetStateAction<number>>
  /**
   * Video height
   */
  height: number
  /**
   * Function to update the height state.
   */
  setHeight: React.Dispatch<React.SetStateAction<number>>
  /**
   * Function to insert the YouTube video in the editor.
   */
  insertVideo: () => void
  /**
   * Function to remove the YouTube video from the editor.
   */
  removeVideo: () => void
  /**
   * Function to open the YouTube video.
   */
  openVideo: () => void
  /**
   * Whether the YouTube video is currently active in the editor.
   */
  isActive: boolean
}

export interface YoutubePopoverProps
  extends Omit<ButtonProps, 'type'>,
    UseYoutubePopoverConfig {
  /**
   * Callback for when the popover opens or closes.
   */
  onOpenChange?: (isOpen: boolean) => void
  /**
   * Whether to automatically open the popover when a YouTube video is active.
   * @default true
   */
  autoOpenOnVideoActive?: boolean
}

/**
 * YouTube button component for triggering the YouTube popover
 */
export const YoutubeButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        type="button"
        className={className}
        data-style="ghost"
        role="button"
        tabIndex={-1}
        aria-label="YouTube"
        tooltip="YouTube 추가"
        ref={ref}
        {...props}
      >
        {children || <YoutubeIcon className="tiptap-button-icon" />}
      </Button>
    )
  },
)

YoutubeButton.displayName = 'YoutubeButton'

/**
 * Main content component for the YouTube popover
 */
const YoutubeMain: React.FC<YoutubeMainProps> = ({
  url,
  setUrl,
  width,
  setWidth,
  height,
  setHeight,
  insertVideo,
  removeVideo,
  openVideo,
  isActive,
}) => {
  const isMobile = useIsMobile()

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      insertVideo()
    }
  }

  return (
    <Card
      style={{
        ...(isMobile
          ? { boxShadow: 'none', border: 0, minWidth: 'auto', maxWidth: 'none' }
          : {}),
      }}
    >
      <CardBody
        style={{
          ...(isMobile ? { padding: 0 } : {}),
        }}
      >
        <CardItemGroup orientation="horizontal">
          {/* URL Input */}
          <InputGroup>
            <Input
              type="url"
              placeholder="YouTube URL을 입력하세요..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              className="w-12"
            />
          </InputGroup>

          {/* Size Controls */}
          {/* <CardItemGroup orientation="horizontal">
            <InputGroup>
              <Input
                type="number"
                placeholder="Width"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value) || 640)}
                min="100"
                max="1920"
              />
            </InputGroup>
            <InputGroup>
              <Input
                type="number"
                placeholder="Height"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value) || 480)}
                min="100"
                max="1080"
              />
            </InputGroup>
          </CardItemGroup> */}

          {/* Action Buttons */}
          <CardItemGroup orientation="horizontal">
            <ButtonGroup orientation="horizontal">
              <Button
                type="button"
                onClick={insertVideo}
                title="YouTube 비디오 삽입"
                disabled={!url && !isActive}
                data-style="ghost"
              >
                <CornerDownLeftIcon className="tiptap-button-icon" />
              </Button>
            </ButtonGroup>

            <Separator />

            <ButtonGroup orientation="horizontal">
              <Button
                type="button"
                onClick={openVideo}
                title="새 창에서 열기"
                disabled={!url && !isActive}
                data-style="ghost"
              >
                <ExternalLinkIcon className="tiptap-button-icon" />
              </Button>

              <Button
                type="button"
                onClick={removeVideo}
                title="YouTube 비디오 제거"
                disabled={!url && !isActive}
                data-style="ghost"
              >
                <TrashIcon className="tiptap-button-icon" />
              </Button>
            </ButtonGroup>
          </CardItemGroup>
        </CardItemGroup>
      </CardBody>
    </Card>
  )
}

/**
 * YouTube content component for standalone use
 */
export const YoutubeContent: React.FC<{
  editor?: Editor | null
}> = ({ editor }) => {
  const youtubePopover = useYoutubePopover({
    editor,
  })

  return <YoutubeMain {...youtubePopover} />
}

/**
 * YouTube popover component for Tiptap editors.
 *
 * For custom popover implementations, use the `useYoutubePopover` hook instead.
 */
export const YoutubePopover = React.forwardRef<
  HTMLButtonElement,
  YoutubePopoverProps
>(
  (
    {
      editor: providedEditor,
      hideWhenUnavailable = false,
      onInsertVideo,
      onOpenChange,
      autoOpenOnVideoActive = false,
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
      canInsert,
      isActive,
      url,
      setUrl,
      width,
      setWidth,
      height,
      setHeight,
      insertVideo,
      removeVideo,
      openVideo,
      label,
      Icon,
    } = useYoutubePopover({
      editor,
      hideWhenUnavailable,
      onInsertVideo,
    })

    const handleOnOpenChange = React.useCallback(
      (nextIsOpen: boolean) => {
        setIsOpen(nextIsOpen)
        onOpenChange?.(nextIsOpen)
      },
      [onOpenChange],
    )

    const handleInsertVideo = React.useCallback(() => {
      insertVideo()
      setIsOpen(false)
    }, [insertVideo])

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        setIsOpen(!isOpen)
      },
      [onClick, isOpen],
    )

    React.useEffect(() => {
      if (autoOpenOnVideoActive && isActive) {
        setIsOpen(true)
      }
    }, [autoOpenOnVideoActive, isActive])

    if (!isVisible) {
      return null
    }

    return (
      <Popover open={isOpen} onOpenChange={handleOnOpenChange}>
        <PopoverTrigger asChild>
          <YoutubeButton
            disabled={!canInsert}
            data-active-state={isActive ? 'on' : 'off'}
            data-disabled={!canInsert}
            aria-label={label}
            aria-pressed={isActive}
            onClick={handleClick}
            {...buttonProps}
            ref={ref}
          >
            {children ?? <Icon className="tiptap-button-icon" />}
          </YoutubeButton>
        </PopoverTrigger>

        <PopoverContent>
          <YoutubeMain
            url={url}
            setUrl={setUrl}
            width={width}
            setWidth={setWidth}
            height={height}
            setHeight={setHeight}
            insertVideo={handleInsertVideo}
            removeVideo={removeVideo}
            openVideo={openVideo}
            isActive={isActive}
          />
        </PopoverContent>
      </Popover>
    )
  },
)

YoutubePopover.displayName = 'YoutubePopover'

export default YoutubePopover
