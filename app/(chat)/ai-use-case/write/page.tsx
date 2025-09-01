'use client'

import { useSession } from 'next-auth/react'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FixedBottomButtons } from '@/components/fixed-bottom-buttons'

export default function CommunityPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!session) {
    return <div />
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/ai-use-case', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      })

      if (response.ok) {
        alert('성공적으로 저장되었습니다!')
        router.push('/ai-use-case')
      } else {
        throw new Error('저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('저장 오류:', error)
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pb-24">
      {/* 제목 입력 필드 */}
      <div className="mb-6">
        <Label htmlFor="title" className="sr-only">
          제목
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-none !text-lg h-12"
        />
      </div>

      {/* 에디터 */}
      <div className="border">
        <SimpleEditor onContentChange={handleContentChange} />
      </div>

      {/* 저장 버튼 */}
      <FixedBottomButtons
        buttons={[
          {
            onClick: () => {
              if (confirm('정말로 취소하시겠습니까?')) {
                router.push(`/ai-use-case`)
              }
            },
            text: '취소',
            variant: 'outline',
          },
          {
            onClick: handleSubmit,
            disabled: isSubmitting || !title.trim() || !content.trim(),
            isLoading: isSubmitting,
            loadingText: '저장중...',
            text: '저장하기',
          },
        ]}
      />
    </div>
  )
}
