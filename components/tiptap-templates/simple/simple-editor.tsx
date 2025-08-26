'use client'

import * as React from 'react'
import { EditorContent, EditorContext, useEditor } from '@tiptap/react'

// --- Tiptap Core Extensions ---
import { StarterKit } from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TextAlign } from '@tiptap/extension-text-align'
import { Typography } from '@tiptap/extension-typography'
import { Highlight } from '@tiptap/extension-highlight'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Selection } from '@tiptap/extensions'
import { TableKit } from '@tiptap/extension-table'
import { BubbleMenu } from '@tiptap/react/menus'

// --- UI Primitives ---
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button'
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from '@/components/tiptap-ui-primitive/toolbar'

// --- Tiptap Node ---
import { ImageUploadNode } from '@/components/tiptap-node/image-upload-node/image-upload-node-extension'
import { HorizontalRule } from '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension'
import '@/components/tiptap-node/blockquote-node/blockquote-node.scss'
import '@/components/tiptap-node/code-block-node/code-block-node.scss'
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss'
import '@/components/tiptap-node/list-node/list-node.scss'
import '@/components/tiptap-node/image-node/image-node.scss'
import '@/components/tiptap-node/heading-node/heading-node.scss'
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss'
import '@/components/tiptap-node/table-node/table-node.scss'

// --- Tiptap UI ---
import { HeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu'
import { ImageUploadButton } from '@/components/tiptap-ui/image-upload-button'
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu'
import { listOptions } from '@/components/tiptap-ui/list-dropdown-menu/use-list-dropdown-menu'
import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button'
import { CodeBlockButton } from '@/components/tiptap-ui/code-block-button'
import { TableDropdownMenu } from '@/components/tiptap-ui/table-dropdown-menu'
import { TablePopover } from '@/components/tiptap-ui/table-popover'
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from '@/components/tiptap-ui/color-highlight-popover'
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from '@/components/tiptap-ui/link-popover'
import { MarkButton } from '@/components/tiptap-ui/mark-button'
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button'
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button'

// --- Icons ---
import { ArrowLeftIcon } from '@/components/tiptap-icons/arrow-left-icon'
import { HighlighterIcon } from '@/components/tiptap-icons/highlighter-icon'
import { LinkIcon } from '@/components/tiptap-icons/link-icon'

// --- Hooks ---
import { useIsMobile } from '@/hooks/use-mobile'
import { useWindowSize } from '@/hooks/use-window-size'
import { useCursorVisibility } from '@/hooks/use-cursor-visibility'

// --- Components ---
import { ThemeToggle } from '@/components/tiptap-templates/simple/theme-toggle'

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from '@/lib/tiptap-utils'
import { FloatingElement } from '@/components/tiptap-ui-utils/floating-element'

// --- Styles ---
import '@/components/tiptap-templates/simple/simple-editor.scss'

import content from '@/components/tiptap-templates/simple/data/content.json'

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <div className="flex flex-wrap p-1 items-center">
      <UndoRedoButton action="undo" tooltip="실행 취소" />
      <UndoRedoButton action="redo" tooltip="다시 실행" />
      <ToolbarSeparator />
      <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
      <ListDropdownMenu
        types={listOptions.map((option) => option.type)}
        portal={isMobile}
      />
      <BlockquoteButton tooltip="인용구" />
      <CodeBlockButton tooltip="코드 블록" />
      <TableDropdownMenu tooltip="테이블" />
      <ToolbarSeparator />
      <MarkButton type="bold" tooltip="굵게" />
      <MarkButton type="italic" tooltip="기울임꼴" />
      <MarkButton type="strike" tooltip="취소선" />
      <MarkButton type="code" tooltip="인라인 코드" />
      <MarkButton type="underline" tooltip="밑줄" />
      {!isMobile ? (
        <ColorHighlightPopover />
      ) : (
        <ColorHighlightPopoverButton onClick={onHighlighterClick} />
      )}
      {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      <ToolbarSeparator />
      <TextAlignButton align="left" tooltip="왼쪽 정렬" />
      <TextAlignButton align="center" tooltip="가운데 정렬" />
      <TextAlignButton align="right" tooltip="오른쪽 정렬" />
      <TextAlignButton align="justify" tooltip="양쪽 정렬" />
      <ToolbarSeparator />
      <ImageUploadButton text="" tooltip="이미지 추가" />
      {isMobile && <ToolbarSeparator />}
    </div>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: 'highlighter' | 'link'
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === 'highlighter' ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === 'highlighter' ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor() {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = React.useState<
    'main' | 'highlighter' | 'link'
  >('main')
  const [isTableSelected, setIsTableSelected] = React.useState(false)
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        'aria-label': 'Main content area, start typing to enter text.',
        class: 'simple-editor',
      },
    },
    onFocus: ({ editor }) => {},
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: 'image/*',
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error('Upload failed:', error),
        type: 'image',
      }),
      TableKit.configure({
        table: {
          resizable: true,
          HTMLAttributes: {
            onclick: () => {
              console.log('table clicked')
              setIsTableSelected(true)
            },
          },
        },
        tableCell: {
          HTMLAttributes: {
            onclick: () => {
              console.log('tableCell clicked')
              setIsTableSelected(true)
            },
          },
        },
      }),
    ],
    content,
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  React.useEffect(() => {
    if (!isMobile && mobileView !== 'main') {
      setMobileView('main')
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper border">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          className="overflow-visible"
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === 'main' ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView('highlighter')}
              onLinkClick={() => setMobileView('link')}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === 'highlighter' ? 'highlighter' : 'link'}
              onBack={() => setMobileView('main')}
            />
          )}
        </Toolbar>
        {isTableSelected.toString()}
        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
        <FloatingElement editor={editor}>
          <Toolbar variant="floating">
            <ButtonGroup orientation="horizontal">
              <MarkButton type="bold" />
              <MarkButton type="italic" />
            </ButtonGroup>
          </Toolbar>
        </FloatingElement>
      </EditorContext.Provider>
    </div>
  )
}
