'use client'

import * as React from 'react'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { Button } from '@/components/tiptap-ui-primitive/button'
import { TableIcon } from '@/components/tiptap-icons/table-icon'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/tiptap-ui-primitive/popover'
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button'
import { Card, CardBody } from '@/components/tiptap-ui-primitive/card'
import { TableColumnDeleteIcon } from '@/components/tiptap-icons/table-column-delete-icon'

export interface TablePopoverProps extends Omit<ButtonProps, 'type'> {
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
 * Popover component for table operations in a Tiptap editor.
 * Shows when a table is selected/clicked.
 */
export const TablePopover = React.forwardRef<
  HTMLButtonElement,
  TablePopoverProps
>(({ editor: providedEditor, tooltip = '테이블', ...buttonProps }, ref) => {
  const { editor } = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = React.useState(false)

  // Check if table is currently selected
  const isTableSelected = React.useMemo(() => {
    if (!editor) return false
    return (
      editor.isActive('table') ||
      editor.isActive('tableRow') ||
      editor.isActive('tableCell')
    )
  }, [editor])

  // Handle table insertion
  const handleInsertTable = React.useCallback(() => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
    setIsOpen(false)
  }, [editor])

  // Handle column operations
  const handleAddColumnBefore = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().addColumnBefore().run()
  }, [editor])

  const handleAddColumnAfter = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().addColumnAfter().run()
  }, [editor])

  const handleDeleteColumn = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteColumn().run()
  }, [editor])

  // Handle row operations
  const handleAddRowBefore = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().addRowBefore().run()
  }, [editor])

  const handleAddRowAfter = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().addRowAfter().run()
  }, [editor])

  const handleDeleteRow = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteRow().run()
  }, [editor])

  // Handle table operations
  const handleDeleteTable = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().deleteTable().run()
    setIsOpen(false)
  }, [editor])

  // Handle cell operations
  const handleMergeCells = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().mergeCells().run()
  }, [editor])

  const handleSplitCell = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().splitCell().run()
  }, [editor])

  // Handle header operations
  const handleToggleHeaderColumn = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().toggleHeaderColumn().run()
  }, [editor])

  const handleToggleHeaderRow = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().toggleHeaderRow().run()
  }, [editor])

  const handleToggleHeaderCell = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().toggleHeaderCell().run()
  }, [editor])

  // Handle other operations
  const handleMergeOrSplit = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().mergeOrSplit().run()
  }, [editor])

  const handleSetCellAttribute = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().setCellAttribute('colspan', 2).run()
  }, [editor])

  const handleFixTables = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().fixTables().run()
  }, [editor])

  const handleGoToNextCell = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().goToNextCell().run()
  }, [editor])

  const handleGoToPreviousCell = React.useCallback(() => {
    if (!editor) return
    editor.chain().focus().goToPreviousCell().run()
  }, [editor])

  if (!editor) return null

  return (
    <Popover open={isTableSelected} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        >
          {/* 트리거 요소는 보이지 않지만 포지셔닝을 위해 필요 */}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start" side="top">
        <Card>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">테이블 편집</h3>
                <Button onClick={handleInsertTable} className="text-xs">
                  새 테이블
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">열 관리</h4>
                  <div className="space-y-1">
                    <Button
                      onClick={handleAddColumnBefore}
                      className="w-full text-xs"
                    >
                      열 앞에 추가
                    </Button>
                    <Button
                      onClick={handleAddColumnAfter}
                      className="w-full text-xs"
                    >
                      열 뒤에 추가
                    </Button>
                    <Button
                      onClick={handleDeleteColumn}
                      className="w-full text-xs"
                    >
                      열 삭제
                      <TableColumnDeleteIcon />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">행 관리</h4>
                  <div className="space-y-1">
                    <Button
                      onClick={handleAddRowBefore}
                      className="w-full text-xs"
                    >
                      행 앞에 추가
                    </Button>
                    <Button
                      onClick={handleAddRowAfter}
                      className="w-full text-xs"
                    >
                      행 뒤에 추가
                    </Button>
                    <Button
                      onClick={handleDeleteRow}
                      className="w-full text-xs"
                    >
                      행 삭제
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">셀 관리</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleMergeCells} className="text-xs">
                    셀 병합
                  </Button>
                  <Button onClick={handleSplitCell} className="text-xs">
                    셀 분할
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">헤더 관리</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={handleToggleHeaderRow} className="text-xs">
                    헤더 행
                  </Button>
                  <Button
                    onClick={handleToggleHeaderColumn}
                    className="text-xs"
                  >
                    헤더 열
                  </Button>
                  <Button onClick={handleToggleHeaderCell} className="text-xs">
                    헤더 셀
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">기타 기능</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleMergeOrSplit} className="text-xs">
                    병합/분할
                  </Button>
                  <Button onClick={handleSetCellAttribute} className="text-xs">
                    셀 속성
                  </Button>
                  <Button onClick={handleFixTables} className="text-xs">
                    테이블 수정
                  </Button>
                  <Button onClick={handleGoToNextCell} className="text-xs">
                    다음 셀
                  </Button>
                </div>
              </div>

              <div className="pt-2 border-t">
                <Button onClick={handleDeleteTable} className="w-full">
                  테이블 삭제
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </PopoverContent>
    </Popover>
  )
})

TablePopover.displayName = 'TablePopover'
