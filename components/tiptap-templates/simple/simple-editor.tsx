'use client'

import * as React from 'react'
import { EditorContent, EditorContext, useEditor } from '@tiptap/react'

// --- Tiptap Core Extensions ---
import { StarterKit } from '@tiptap/starter-kit'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TextAlign } from '@tiptap/extension-text-align'
import { Typography } from '@tiptap/extension-typography'
import { Highlight } from '@tiptap/extension-highlight'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Selection } from '@tiptap/extensions'
import { TableKit } from '@tiptap/extension-table'
import Youtube from '@tiptap/extension-youtube'

// --- UI Primitives ---
import { Button } from '@/components/tiptap-ui-primitive/button'
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from '@/components/tiptap-ui-primitive/toolbar'

// --- Tiptap Node ---
import { ImageUploadNode } from '@/components/tiptap-node/image-upload-node/image-upload-node-extension'
import { EnhancedImageNode } from '@/components/tiptap-node/enhanced-image-node/enhanced-image-node-extension'
import { HorizontalRule } from '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension'
import '@/components/tiptap-node/blockquote-node/blockquote-node.scss'
import '@/components/tiptap-node/code-block-node/code-block-node.scss'
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss'
import '@/components/tiptap-node/list-node/list-node.scss'
import '@/components/tiptap-node/image-node/image-node.scss'
import '@/components/tiptap-node/enhanced-image-node/enhanced-image-node.scss'
import '@/components/tiptap-node/heading-node/heading-node.scss'
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss'
import '@/components/tiptap-node/table-node/table-node.scss'
import '@/components/tiptap-node/youtube-node/youtube-node.scss'

// --- Tiptap UI ---
import { HeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu'
import { ImageUploadButton } from '@/components/tiptap-ui/image-upload-button'
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu'
import { listOptions } from '@/components/tiptap-ui/list-dropdown-menu/use-list-dropdown-menu'
import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button'
import { CodeBlockButton } from '@/components/tiptap-ui/code-block-button'
import { HorizontalRuleButton } from '@/components/tiptap-ui/horizontal-rule-button'
import { TableDropdownMenu } from '@/components/tiptap-ui/table-dropdown-menu'

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
import {
  YoutubePopover,
  YoutubeButton,
} from '@/components/tiptap-ui/youtube-popover'

// --- Icons ---
import { ArrowLeftIcon } from '@/components/tiptap-icons/arrow-left-icon'
import { HighlighterIcon } from '@/components/tiptap-icons/highlighter-icon'
import { LinkIcon } from '@/components/tiptap-icons/link-icon'
import { YoutubeIcon } from '@/components/tiptap-icons/youtube-icon'

// --- Hooks ---
import { useIsMobile } from '@/hooks/use-mobile'
import { useWindowSize } from '@/hooks/use-window-size'
import { useCursorVisibility } from '@/hooks/use-cursor-visibility'

// --- Components ---

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from '@/lib/tiptap-utils'

// --- Styles ---
import '@/components/tiptap-templates/simple/simple-editor.scss'

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  onYoutubeClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  onYoutubeClick: () => void
  isMobile: boolean
}) => {
  return (
    <div className="flex flex-nowrap p-1 items-center sm:flex-wrap">
      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ToolbarSeparator />
      </ToolbarGroup>
      <ToolbarGroup>
        <MarkButton type="bold" tooltip="굵게" />
        <MarkButton type="italic" tooltip="기울임꼴" />
        <MarkButton type="underline" tooltip="밑줄" />
        <MarkButton type="strike" tooltip="취소선" />
        <MarkButton type="code" tooltip="인라인 코드" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <TextAlignButton align="left" tooltip="왼쪽 정렬" />
        <TextAlignButton align="center" tooltip="가운데 정렬" />
        <TextAlignButton align="right" tooltip="오른쪽 정렬" />
        <TextAlignButton align="justify" tooltip="양쪽 정렬" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="superscript" tooltip="위 첨자" />
        <MarkButton type="subscript" tooltip="아래 첨자" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <ListDropdownMenu
          types={listOptions.map((option) => option.type)}
          portal={isMobile}
        />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <HorizontalRuleButton tooltip="수평선" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <TableDropdownMenu tooltip="테이블" />
        <BlockquoteButton tooltip="인용구" />
        <CodeBlockButton tooltip="코드 블록" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
        <ImageUploadButton text="" tooltip="이미지 추가" />
        {!isMobile ? (
          <YoutubePopover />
        ) : (
          <YoutubeButton onClick={onYoutubeClick} tooltip="유튜브 추가" />
        )}
      </ToolbarGroup>
      {isMobile && <ToolbarSeparator />}
    </div>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: 'highlighter' | 'link' | 'youtube'
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === 'highlighter' ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : type === 'link' ? (
          <LinkIcon className="tiptap-button-icon" />
        ) : (
          <YoutubeIcon className="tiptap-button-icon" />
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

export function SimpleEditor({
  onContentChange,
  viewMode = false,
  initialContent,
}: {
  onContentChange?: (content: string) => void
  viewMode?: boolean
  initialContent?: string
}) {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = React.useState<
    'main' | 'highlighter' | 'link' | 'youtube'
  >('main')
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editable: !viewMode, // 뷰 모드 설정
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        'aria-label': viewMode
          ? 'Content viewer'
          : 'Main content area, start typing to enter text.',
        class: `simple-editor`,
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: viewMode, // 뷰 모드일 때만 링크 클릭 가능
          enableClickSelection: !viewMode,
          HTMLAttributes: {
            target: '_self', // 기본값
          },
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      EnhancedImageNode,
      Typography,
      Superscript,
      Subscript,
      Selection,
      // 뷰 모드에서는 이미지 업로드 비활성화
      ...(viewMode
        ? []
        : [
            ImageUploadNode.configure({
              accept: 'image/*',
              maxSize: MAX_FILE_SIZE,
              limit: 3,
              upload: handleImageUpload,
              onError: (error: Error) => console.error('Upload failed:', error),
              type: 'image', // EnhancedImageNode와 동일한 타입
            }),
          ]),
      TableKit.configure({
        table: { resizable: !viewMode }, // 뷰 모드에서는 테이블 크기 조절 비활성화
      }),
      Youtube.configure({
        controls: false,
        nocookie: true,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      if (onContentChange && !viewMode) {
        onContentChange(editor.getHTML())
      }
    },
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
    <div
      className={
        viewMode ? 'simple-editor-wrapper-viewmode' : 'simple-editor-wrapper'
      }
    >
      <EditorContext.Provider value={{ editor }}>
        {/* 뷰 모드에서는 툴바 숨김 */}
        {!viewMode && (
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
                onYoutubeClick={() => setMobileView('youtube')}
                isMobile={isMobile}
              />
            ) : (
              <MobileToolbarContent
                type={
                  mobileView === 'highlighter'
                    ? 'highlighter'
                    : mobileView === 'link'
                      ? 'link'
                      : 'youtube'
                }
                onBack={() => setMobileView('main')}
              />
            )}
          </Toolbar>
        )}
        <EditorContent
          editor={editor}
          role="presentation"
          className={`simple-editor-content`}
        />

        {/* 뷰 모드에서는 테이블 플로팅 메뉴 숨김 */}
        {/* {!viewMode && <TableFloatingMenu editor={editor} />} */}
      </EditorContext.Provider>
    </div>
  )
}
