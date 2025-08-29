'use client'

import { useSession } from 'next-auth/react'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CommunityPage() {
  const { data: session } = useSession()
  const router = useRouter()
  if (!session) {
    return <div />
  }

  return (
    <div className="pb-32">
      {/* 뒤로가기 버튼 */}
      <Button
        type="button"
        variant="link"
        onClick={() => router.push('/ai-use-case')}
        className="mb-6 flex items-center pl-0"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>목록으로</span>
      </Button>
      <SimpleEditor />
    </div>
  )
}
