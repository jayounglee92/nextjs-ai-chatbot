'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { errorPage } from '@/components/error-page'
import { LoadingPage } from '@/components/loading-page'
import {
  handleFetchError,
  handleApiError,
  showSuccessToast,
} from '@/lib/toast-utils'
import { FixedBottomButtons } from '@/components/fixed-bottom-buttons'

export default function AiUseCaseEditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (params.id && session) {
      fetchAiUseCase(params.id as string)
    }
  }, [params.id, session])

  const fetchAiUseCase = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/ai-use-case?id=${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          setError('AI 활용사례를 찾을 수 없습니다.')
        } else {
          setError('AI 활용사례를 불러오는데 실패했습니다.')
        }
        return
      }

      const data = await response.json()
      setTitle(data.title)
      setContent(data.content)
    } catch (err) {
      console.error('Failed to fetch AI use case:', err)
      setError('AI 활용사례를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
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
      const response = await fetch(`/api/ai-use-case?id=${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      })

      if (response.ok) {
        // ✅ 성공 케이스
        showSuccessToast('성공적으로 수정되었습니다!')
        router.push(`/ai-use-case/${params.id}`)
      } else {
        await handleApiError(response, router, {
          forbiddenMessage: '본인이 작성한 AI 활용사례만 수정할 수 있습니다',
          notFoundMessage: '삭제되었거나 존재하지 않는 AI 활용사례입니다',
          validationMessage: '제목과 내용을 올바르게 입력했는지 확인해보세요',
        })
      }
    } catch (error) {
      // 네트워크 오류나 기타 런타임 오류 처리
      handleFetchError(error, router, '수정')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return <LoadingPage />
  }

  if (!session) {
    return <div />
  }

  if (error) {
    return errorPage({
      title: '오류가 발생했습니다',
      description: error,
      actions: (
        <Button onClick={() => router.push('/ai-use-case')}>목록으로</Button>
      ),
    })
  }

  if (!content) {
    return errorPage({
      title: 'AI 활용 사례를 찾을 수 없습니다',
      description: '요청하신 ID의 AI 활용 사례가 존재하지 않습니다.',
      actions: (
        <Button onClick={() => router.push('/ai-use-case')}>목록으로</Button>
      ),
    })
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
        <SimpleEditor
          onContentChange={handleContentChange}
          initialContent={content}
        />
      </div>

      {/* 저장 버튼 */}
      <FixedBottomButtons
        buttons={[
          {
            onClick: () => {
              if (confirm('정말로 취소하시겠습니까?')) {
                router.push(`/ai-use-case/${params.id}`)
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
