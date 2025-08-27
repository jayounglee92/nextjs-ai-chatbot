'use client'

import * as React from 'react'
import type { Editor } from '@tiptap/react'

// --- Hooks ---
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'

// --- Lib ---
import { isNodeInSchema } from '@/lib/tiptap-utils'
import { ColumnInsertLeftIcon } from '@/components/tiptap-icons/column-insert-left-icon'
import { ColumnInsertRightIcon } from '@/components/tiptap-icons/column-insert-right-icon'
import { ColumnRemoveIcon } from '@/components/tiptap-icons/column-remove-icon'
import { RowInsertTopIcon } from '@/components/tiptap-icons/row-insert-top-icon'
import { RowInsertBottomIcon } from '@/components/tiptap-icons/row-insert-bottom-icon'
import { RowRemoveIcon } from '@/components/tiptap-icons/row-remove-icon'
import { TableDeleteIcon } from '@/components/tiptap-icons/table-delete-icon'
import { TableColumnIcon } from '@/components/tiptap-icons/table-column-icon'
import { TableRowIcon } from '@/components/tiptap-icons/table-row-icon'

// 테이블 작업 타입 정의
export type TableActionType =
  | 'addColumnBefore'
  | 'addColumnAfter'
  | 'deleteColumn'
  | 'addRowBefore'
  | 'addRowAfter'
  | 'deleteRow'
  | 'deleteTable'
  //   | 'mergeCells'
  //   | 'splitCell'
  | 'toggleHeaderColumn'
  | 'toggleHeaderRow'
//   | 'toggleHeaderCell'
//   | 'mergeOrSplit'
//   | 'setCellAttribute'
//   | 'fixTables'
//   | 'goToNextCell'
//   | 'goToPreviousCell'

/**
 * Configuration for the table functionality
 */
export interface UseTableConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when table is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful table operation.
   */
  onTableAction?: () => void

  type: TableActionType
}

export const tableIcons = {
  addColumnBefore: ColumnInsertLeftIcon,
  addColumnAfter: ColumnInsertRightIcon,
  deleteColumn: ColumnRemoveIcon,
  addRowBefore: RowInsertTopIcon,
  addRowAfter: RowInsertBottomIcon,
  deleteRow: RowRemoveIcon,
  deleteTable: TableDeleteIcon,
  toggleHeaderRow: TableRowIcon,
  toggleHeaderColumn: TableColumnIcon,
}

/**
 * Checks if table operations can be performed in the current editor state
 */
export function canPerformTableAction(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema('table', editor)) return false

  return true
}

/**
 * Checks if table is currently active
 */
export function isTableActive(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false

  return (
    editor.isActive('table') ||
    editor.isActive('tableRow') ||
    editor.isActive('tableCell') ||
    editor.isActive('tableHeader')
  )
}

/**
 * Checks if the current table has header row
 */
export function isActiveHeaderRow(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false

  try {
    const { state } = editor.view
    const { selection } = state

    // 현재 위치에서 테이블 노드 찾기
    let tablePos = -1
    let tableNode = null

    for (let depth = selection.$anchor.depth; depth >= 0; depth--) {
      const node = selection.$anchor.node(depth)
      if (node.type.name === 'table') {
        tablePos = selection.$anchor.start(depth)
        tableNode = node
        break
      }
    }

    if (tablePos !== -1 && tableNode) {
      // 첫 번째 행이 헤더 행인지 확인
      const firstRow = tableNode.firstChild
      if (firstRow && firstRow.type.name === 'tableRow') {
        // 첫 번째 행의 모든 셀이 헤더 셀인지 확인
        let hasHeaderRow = true

        for (let i = 0; i < firstRow.childCount; i++) {
          const cell = firstRow.child(i)
          if (!cell || cell.type.name !== 'tableHeader') {
            hasHeaderRow = false
            break
          }
        }

        return hasHeaderRow
      }
    }

    return false
  } catch {
    return false
  }
}

/**
 * Checks if the current table has header column
 */
export function isActiveHeaderColumn(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false

  try {
    const { state } = editor.view
    const { selection } = state

    // 현재 위치에서 테이블 노드 찾기
    let tablePos = -1
    let tableNode = null

    for (let depth = selection.$anchor.depth; depth >= 0; depth--) {
      const node = selection.$anchor.node(depth)
      if (node.type.name === 'table') {
        tablePos = selection.$anchor.start(depth)
        tableNode = node
        break
      }
    }

    if (tablePos !== -1 && tableNode) {
      // 첫 번째 열의 모든 셀이 헤더 셀인지 확인
      let hasHeaderColumn = true

      for (let i = 0; i < tableNode.childCount; i++) {
        const row = tableNode.child(i)
        if (row && row.type.name === 'tableRow') {
          // 첫 번째 셀(첫 번째 열)이 헤더 셀인지 확인
          const firstCell = row.firstChild
          if (!firstCell || firstCell.type.name !== 'tableHeader') {
            hasHeaderColumn = false
            break
          }
        }
      }

      return hasHeaderColumn
    }

    return false
  } catch {
    return false
  }
}

/**
 * Determines if the table button should be shown
 */
export function shouldShowTableButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema('table', editor)) return false

  if (hideWhenUnavailable) {
    return canPerformTableAction(editor)
  }

  return true
}

/**
 * Executes a table action in the editor
 */
export function executeTableAction(
  editor: Editor | null,
  type: TableActionType,
): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canPerformTableAction(editor)) return false

  try {
    switch (type) {
      case 'addColumnBefore':
        editor.chain().focus().addColumnBefore().run()
        break
      case 'addColumnAfter':
        editor.chain().focus().addColumnAfter().run()
        break
      case 'deleteColumn':
        editor.chain().focus().deleteColumn().run()
        break
      case 'addRowBefore':
        editor.chain().focus().addRowBefore().run()
        break
      case 'addRowAfter':
        editor.chain().focus().addRowAfter().run()
        break
      case 'deleteRow':
        editor.chain().focus().deleteRow().run()
        break
      case 'deleteTable':
        editor.chain().focus().deleteTable().run()
        break
      // case 'mergeCells':
      //   editor.chain().focus().mergeCells().run()
      //   break
      // case 'splitCell':
      //   editor.chain().focus().splitCell().run()
      //   break
      case 'toggleHeaderColumn':
        editor.chain().focus().toggleHeaderColumn().run()
        break
      case 'toggleHeaderRow':
        editor.chain().focus().toggleHeaderRow().run()
        break
      // case 'toggleHeaderCell':
      //   editor.chain().focus().toggleHeaderCell().run()
      //   break
      // case 'mergeOrSplit':
      //   editor.chain().focus().mergeOrSplit().run()
      //   break
      // case 'setCellAttribute':
      //   editor.chain().focus().setCellAttribute('colspan', 2).run()
      //   break
      // case 'fixTables':
      //   editor.chain().focus().fixTables().run()
      //   break
      // case 'goToNextCell':
      //   editor.chain().focus().goToNextCell().run()
      //   break
      // case 'goToPreviousCell':
      //   editor.chain().focus().goToPreviousCell().run()
      //   break
      default:
        return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Gets the formatted table action name
 */
export function getFormattedTableActionName(type: TableActionType): string {
  const actionNames: Record<TableActionType, string> = {
    addColumnBefore: '맨앞에 열 추가',
    addColumnAfter: '맨뒤에 열 추가',
    deleteColumn: '현재 열 삭제',
    addRowBefore: '바로 앞에 행 추가',
    addRowAfter: '바로 뒤에 행 추가',
    deleteRow: '현재 행 삭제',
    deleteTable: '선택한 테이블 삭제',
    toggleHeaderColumn: '열 헤더 토글',
    toggleHeaderRow: '행 헤더 토글',
  }
  return actionNames[type]
}

/**
 * Custom hook that provides table functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MyTableButton() {
 *   const { isVisible, isActive, canPerformAction, handleTableAction } = useTable({ type: "addColumnBefore" })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <button
 *       onClick={handleTableAction}
 *       aria-pressed={isActive}
 *       disabled={!canPerformAction}
 *     >
 *       Add Column Before
 *     </button>
 *   )
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedTableButton() {
 *   const { isVisible, isActive, canPerformAction, handleTableAction } = useTable({
 *     editor: myEditor,
 *     type: "deleteRow",
 *     hideWhenUnavailable: true,
 *     onTableAction: () => console.log('Table action performed')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleTableAction}
 *       aria-pressed={isActive}
 *       disabled={!canPerformAction}
 *     >
 *       Delete Row
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useTable(config: UseTableConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onTableAction,
    type,
  } = config

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = React.useState<boolean>(true)
  const canPerformAction = canPerformTableAction(editor)
  const isActive = isTableActive(editor)
  const isActiveHeaderRowState = isActiveHeaderRow(editor)
  const isActiveHeaderColumnState = isActiveHeaderColumn(editor)

  React.useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowTableButton({ editor, hideWhenUnavailable }))
    }

    handleSelectionUpdate()

    editor.on('selectionUpdate', handleSelectionUpdate)

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleTableAction = React.useCallback(() => {
    if (!editor) return false

    const success = executeTableAction(editor, type)
    if (success) {
      onTableAction?.()
    }
    return success
  }, [editor, type, onTableAction])

  return {
    isVisible,
    isActive,
    isActiveHeaderRow: isActiveHeaderRowState,
    isActiveHeaderColumn: isActiveHeaderColumnState,
    handleTableAction,
    canPerformAction,
    label: getFormattedTableActionName(type),
    Icon: tableIcons[type],
  }
}
