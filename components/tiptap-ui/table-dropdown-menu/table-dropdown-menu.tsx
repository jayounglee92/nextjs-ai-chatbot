'use client'

import * as React from 'react'
import type { Editor } from '@tiptap/react'
import { useTiptapEditor } from '@/hooks/use-tiptap-editor'
import { Button } from '@/components/tiptap-ui-primitive/button'
import { TableIcon } from '@/components/tiptap-icons/table-icon'
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/tiptap-ui-primitive/dropdown-menu'
import { Card, CardBody } from '@/components/tiptap-ui-primitive/card'
import type { ButtonProps } from '@/components/tiptap-ui-primitive/button'

export interface TableDropdownMenuProps extends Omit<ButtonProps, 'type'> {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor
  /**
   * Whether to render the dropdown menu in a portal
   * @default false
   */
  portal?: boolean
}

export function TableDropdownMenu({
  editor: providedEditor,
  portal = false,
  ...props
}: TableDropdownMenuProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedRows, setSelectedRows] = React.useState(0)
  const [selectedCols, setSelectedCols] = React.useState(0)

  const handleOnOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSelectedRows(0)
      setSelectedCols(0)
    }
  }, [])

  const handleCellHover = React.useCallback((row: number, col: number) => {
    setSelectedRows(row + 1)
    setSelectedCols(col + 1)
  }, [])

  const handleCellClick = React.useCallback(
    (row: number, col: number) => {
      if (!editor) return

      const rows = row + 1
      const cols = col + 1

      editor.commands.insertTable({
        rows,
        cols,
        withHeaderRow: rows > 1,
      })
      setIsOpen(false)
      setSelectedRows(0)
      setSelectedCols(0)
    },
    [editor],
  )

  if (!editor || !editor.isEditable) {
    return null
  }

  const maxRows = 8
  const maxCols = 10

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOnOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          role="button"
          tabIndex={-1}
          aria-label="Table options"
          tooltip="테이블"
          {...props}
        >
          <TableIcon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" portal={portal}>
        <Card>
          <CardBody>
            <div className="p-1">
              {/* Table Grid Selector */}
              <div className="mb-2">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${maxCols}, 18px)`,
                    gridTemplateRows: `repeat(${maxRows}, 18px)`,
                  }}
                >
                  {Array.from({ length: maxRows * maxCols }).map((_, i) => {
                    const row = Math.floor(i / maxCols)
                    const col = i % maxCols
                    const isSelected = row < selectedRows && col < selectedCols

                    return (
                      <div
                        key={`${row}-${col}`}
                        className={`w-4 h-4 border border-gray-200 cursor-pointer transition-colors ${
                          isSelected ? 'bg-black' : 'bg-white hover:bg-gray-100'
                        }`}
                        onMouseEnter={() => handleCellHover(row, col)}
                        onClick={() => handleCellClick(row, col)}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Selected Size Display */}
              {selectedRows > 0 && selectedCols > 0 && (
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {selectedRows} x {selectedCols}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
