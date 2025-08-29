'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AiUseCaseList } from '@/components/ai-use-case-list'
import { aiUseCases } from '@/lib/data/ai-use-cases'

export default function AiUseCasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <div />
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">
        AI 활용 사례
      </h1>
      <AiUseCaseList useCases={aiUseCases} />
    </div>
  )
}
