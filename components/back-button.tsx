'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  variant?: 'default' | 'outline'
  className?: string
  children?: React.ReactNode
}

export function BackButton({
  variant = 'outline',
  className = 'w-full',
  children = '이전 페이지로 돌아가기',
}: BackButtonProps) {
  const router = useRouter()

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => router.back()}
    >
      <ArrowLeft className="size-4" />
      {children}
    </Button>
  )
}
