'use client'

import * as React from 'react'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { Button } from '@/components/tiptap-ui-primitive/button'
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button'
import { useTable, type TableActionType } from './use-table'

export interface TableButtonProps extends Omit<ButtonProps, 'type'> {
  /**
   * 테이블 작업 타입
   */
  type: TableActionType
  /**
   * 선택적 툴팁 텍스트
   */
  tooltip?: string
  /**
   * 선택적 텍스트 표시
   */
  text?: string
}

/**
 * 테이블 작업을 수행하는 버튼 컴포넌트
 */
export const TableButton = React.forwardRef<
  HTMLButtonElement,
  TableButtonProps
>(({ type, tooltip, text, ...buttonProps }, ref) => {
  const { editor } = useTiptapEditor()
  const {
    Icon,
    label,
    handleTableAction,
    canPerformAction,
    isActive,
    isActiveHeaderRow,
    isActiveHeaderColumn,
  } = useTable({
    editor,
    type,
  })

  const handleClick = React.useCallback(() => {
    if (!editor) return
    handleTableAction()
  }, [editor, handleTableAction])

  if (!editor) return null

  // 헤더 관련 버튼의 경우 헤더 상태에 따라 active state 결정
  const getActiveState = () => {
    if (type === 'toggleHeaderRow') {
      return isActiveHeaderRow ? 'on' : 'off'
    }
    if (type === 'toggleHeaderColumn') {
      return isActiveHeaderColumn ? 'on' : 'off'
    }
    return undefined
  }

  return (
    <Button
      type="button"
      data-style="ghost"
      role="button"
      tabIndex={-1}
      aria-label={label}
      tooltip={label}
      onClick={handleClick}
      disabled={!canPerformAction}
      data-disabled={!canPerformAction}
      data-active-state={getActiveState()}
      {...buttonProps}
      ref={ref}
    >
      <Icon className="tiptap-button-icon" />
      {text}
    </Button>
  )
})

TableButton.displayName = 'TableButton'
