import { Button } from '@/components/ui/button'
import { LoadingSpinnerIcon } from '@/components/tiptap-icons/loading-spinner-icon'
import type { ReactNode } from 'react'

interface ButtonConfig {
  onClick: () => void
  disabled?: boolean
  isLoading?: boolean
  loadingText?: string
  text: string
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  className?: string
  icon?: ReactNode
}

interface FixedBottomButtonsProps {
  buttons: ButtonConfig[]
  align?: 'left' | 'center' | 'right' | 'between'
  className?: string
}

export const FixedBottomButtons = ({
  buttons,
  align = 'right',
  className = '',
}: FixedBottomButtonsProps) => {
  const getAlignmentClass = () => {
    switch (align) {
      case 'left':
        return 'justify-start'
      case 'center':
        return 'justify-center'
      case 'between':
        return 'justify-between'
      case 'right':
      default:
        return 'justify-end'
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 z-50">
      <div
        className={`max-w-6xl mx-auto flex ${getAlignmentClass()} gap-3 ${className}`}
      >
        {buttons.map((button) => (
          <Button
            key={button.text}
            onClick={button.onClick}
            disabled={button.disabled}
            variant={button.variant || 'default'}
            className={`px-6 ${button.className || ''}`}
          >
            {button.isLoading ? (
              <>
                <LoadingSpinnerIcon />
                {button.loadingText || '처리중...'}
              </>
            ) : (
              <>
                {button.icon}
                {button.text}
              </>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}
