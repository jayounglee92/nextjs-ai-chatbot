'use client'

import * as React from 'react'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { ButtonGroup } from '@/components/tiptap-ui-primitive/button'
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button'
import { useTable, TableButton } from '@/components/tiptap-ui/table-button'
import { FloatingElement } from '@/components/tiptap-ui-utils/floating-element'
import {
  Toolbar,
  ToolbarSeparator,
} from '@/components/tiptap-ui-primitive/toolbar'

export interface TableFloatingMenuProps extends Omit<ButtonProps, 'type'> {
  /**
   * The Tiptap editor instance.
   */
  editor?: any
  /**
   * Optional tooltip text for the button.
   */
  tooltip?: string
  /**
   * The type of table operation to perform.
   */
  // type: TableActionType
}

/**
 * Floating menu component for table operations in a Tiptap editor.
 * Shows when a table is selected/clicked.
 */
export const TableFloatingMenu = React.forwardRef<
  HTMLButtonElement,
  TableFloatingMenuProps
>(({ editor: providedEditor, tooltip = '테이블', ...buttonProps }, ref) => {
  const { editor } = useTiptapEditor(providedEditor)
  const { isActive: isTableActive } = useTable({
    editor: providedEditor,
    type: 'addColumnBefore',
  })

  if (!editor) return null

  return (
    <FloatingElement
      editor={editor}
      shouldShow={isTableActive}
      getBoundingClientRect={(editor) => {
        // 테이블이 액티브된 경우 테이블 요소의 위치를 찾아서 반환
        if (isTableActive && editor) {
          // 현재 선택된 테이블 노드를 찾기
          const { state } = editor.view
          const { selection } = state

          // 테이블 노드의 위치 찾기
          let tablePos = -1

          // 현재 위치에서 위로 올라가면서 테이블 노드 찾기
          for (let depth = selection.$anchor.depth; depth >= 0; depth--) {
            const node = selection.$anchor.node(depth)
            if (node.type.name === 'table') {
              tablePos = selection.$anchor.start(depth)
              break
            }
          }

          if (tablePos !== -1) {
            // 테이블 노드의 DOM 요소 찾기
            const dom = editor.view.nodeDOM(tablePos) as HTMLElement
            if (dom) {
              const rect = dom.getBoundingClientRect()

              // 테이블 위에 표시하기 위해 y 위치를 조정
              return new DOMRect(
                rect.left,
                rect.top, // 테이블 위에 60px 간격
                rect.width,
                40, // FloatingElement의 높이
              )
            }
          }
        }

        // 기본적으로는 null 반환하여 기본 위치 사용
        return null
      }}
    >
      <Toolbar variant="floating">
        <ButtonGroup orientation="horizontal">
          {/* 열 관리 버튼들 */}
          <TableButton type="addColumnBefore" />

          <TableButton type="addColumnAfter" />
          <TableButton type="deleteColumn" />
        </ButtonGroup>
        <ToolbarSeparator />
        <ButtonGroup orientation="horizontal">
          {/* 행 관리 버튼들 */}
          <TableButton type="addRowBefore" />
          <TableButton type="addRowAfter" />
          <TableButton type="deleteRow" />
        </ButtonGroup>
        <ToolbarSeparator />
        <ButtonGroup orientation="horizontal">
          {/* 셀 관리 버튼들 */}
          {/* <TableButton type="mergeCells" />
          <TableButton type="splitCell" /> */}
        </ButtonGroup>

        <ButtonGroup orientation="horizontal">
          {/* 헤더 관리 버튼들 */}
          <TableButton type="toggleHeaderRow" />
          <TableButton type="toggleHeaderColumn" />
          {/* <TableButton type="toggleHeaderCell" /> */}
        </ButtonGroup>

        <ButtonGroup orientation="horizontal">
          {/* 기타 기능 버튼들 */}
          {/* <TableButton type="mergeOrSplit" /> */}
          {/* <TableButton type="setCellAttribute" /> */}
          {/* <TableButton type="fixTables" /> */}
        </ButtonGroup>

        {/* 셀 이동 버튼들 */}
        {/* <ButtonGroup orientation="horizontal">
          <TableButton type="goToPreviousCell" />
          <TableButton type="goToNextCell" />
        </ButtonGroup> */}

        <ButtonGroup orientation="horizontal">
          {/* 테이블 삭제 버튼 */}
          <TableButton type="deleteTable" />
        </ButtonGroup>
      </Toolbar>
    </FloatingElement>
  )
})

TableFloatingMenu.displayName = 'TableFloatingMenu'
