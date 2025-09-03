'use client'

import { useSession } from 'next-auth/react'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { ThumbnailUpload } from '@/components/thumbnail-upload'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FixedBottomButtons } from '@/components/fixed-bottom-buttons'
import { useSWRConfig } from 'swr'
import {
  handleFetchError,
  handleApiError,
  showSuccessToast,
} from '@/lib/toast-utils'
import type { AiUseCase } from '@/lib/db/schema'
import { validateAiUseCaseCreate } from '@/lib/validators/ai-use-case'
import { formatValidationErrors } from '@/lib/utils'
import { handleImageUpload } from '@/lib/tiptap-utils'
import { toast } from 'sonner'
import sanitizeHtml from 'sanitize-html'
import Link from 'next/link'
import { ChevronRightIcon } from 'lucide-react'

export default function CommunityPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isDisabledSaveButton =
    isSubmitting ||
    !title?.trim() ||
    sanitizeHtml(content, {
      allowedTags: [],
      allowedAttributes: {},
    }).length === 0 ||
    !thumbnailUrl

  if (!session) {
    return <div />
  }

  const handleSubmit = async () => {
    // 유효성 검사
    const validation = validateAiUseCaseCreate({
      title: title.trim(),
      content: content.trim(),
      thumbnailUrl: thumbnailUrl || '',
    })

    if (!validation.success) {
      alert(formatValidationErrors(validation.errors || ['유효성 검사 실패']))
      return
    }

    setIsSubmitting(true)

    try {
      // SWR mutate를 사용한 낙관적 업데이트
      await mutate(
        '/api/ai-use-case',
        async (currentData: AiUseCase[] | undefined) => {
          // 서버에 POST 요청
          const response = await fetch('/api/ai-use-case', {
            method: 'POST',
            body: JSON.stringify({
              title: title.trim(),
              content: content.trim(),
              thumbnailUrl: thumbnailUrl || undefined,
            }),
          })

          if (!response.ok) {
            await handleApiError(response, router, {
              forbiddenMessage: '로그인이 필요합니다',
              validationMessage:
                '제목과 내용을 올바르게 입력했는지 확인해보세요',
            })
            // 에러 시 기존 데이터 유지
            return currentData
          }

          const newAiUseCase = await response.json()

          // ✅ 성공 케이스
          showSuccessToast('성공적으로 저장되었습니다!')
          router.push('/ai-use-case')

          // 새로운 데이터를 캐시에 추가 (낙관적 업데이트)
          if (Array.isArray(currentData)) {
            return [newAiUseCase, ...currentData]
          }
          return currentData
        },
        {
          // 자동 재검증 활성화 (서버에서 최신 데이터 가져오기)
          revalidate: true,
        },
      )
    } catch (error) {
      // 네트워크 오류나 기타 런타임 오류 처리
      handleFetchError(error, router, '저장')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link
          href="/ai-use-case"
          className="hover:text-foreground transition-colors"
        >
          AI 활용 사례
        </Link>
        <ChevronRightIcon className="size-4" />
        <span className="text-foreground">글쓰기</span>
      </nav>

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
          onContentChange={(newContent) => setContent(newContent)}
        />
      </div>

      {/* 썸네일 업로드 */}
      <div className="flex gap-4 mt-6">
        <Label className="text-sm font-medium block break-keep">
          썸네일 이미지 <span className="text-red-500">*</span>
        </Label>
        <ThumbnailUpload
          imageUrl={thumbnailUrl || undefined}
          onImageChange={setThumbnailUrl}
          uploadOptions={{
            maxSize: 5 * 1024 * 1024, // 5MB
            limit: 1,
            accept: 'image/jpeg,image/jng,image/png,image/webp',
            upload: handleImageUpload,
            onSuccess: (url) => {
              setThumbnailUrl(url)
            },
            onError: (error) => {
              console.error('이미지 업로드 실패:', error)
              toast.error(`이미지 업로드에 실패했습니다.\n ${error.message}`)
            },
          }}
        />
      </div>

      {/* 저장 버튼 */}
      <FixedBottomButtons
        buttons={[
          {
            onClick: () => {
              if (confirm('정말로 취소하시겠습니까?') === false) return
              router.push(`/ai-use-case`)
            },
            text: '취소',
            variant: 'outline',
          },
          {
            onClick: handleSubmit,
            disabled: isDisabledSaveButton,
            isLoading: isSubmitting,
            loadingText: '저장중...',
            text: '저장하기',
          },
        ]}
      />
    </div>
  )
}
