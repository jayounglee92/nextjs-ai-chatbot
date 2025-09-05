'use client'

import { useSession } from 'next-auth/react'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { ThumbnailUpload } from '@/components/thumbnail-upload'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FixedBottomButtons } from '@/components/fixed-bottom-buttons'
import { useSWRConfig } from 'swr'
import {
  handleFetchError,
  handleApiError,
  showSuccessToast,
} from '@/lib/toast-utils'
import type { PostContents } from '@/lib/db/schema'
import { validatePostContentsCreate } from '@/lib/validators/post-contents'
import { formatValidationErrors } from '@/lib/utils'
import { handleImageUpload } from '@/lib/tiptap-utils'
import { toast } from 'sonner'
import sanitizeHtml from 'sanitize-html'
import { TagInput } from '@/components/tag-input'
import { PageBreadcrumb } from '@/components/page-breadcrumb'

const MAX_TAGS_COUNT = 10

export default function NewsLetterWritePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { mutate } = useSWRConfig()

  // 폼 상태
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 유효성 검사
  const isDisabledSaveButton = React.useMemo(
    () =>
      isSubmitting ||
      !title?.trim() ||
      sanitizeHtml(content, {
        allowedTags: [],
        allowedAttributes: {},
      }).length === 0 ||
      !thumbnailUrl,
    [isSubmitting, title, content, thumbnailUrl],
  )

  const handleSubmit = React.useCallback(async () => {
    // 유효성 검사
    const validation = validatePostContentsCreate({
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || undefined,
      tags: tags,
      userId: session?.user?.id || '',
    })

    if (!validation.success) {
      const errorMessages = validation.error.errors.map((err) => err.message)
      alert(formatValidationErrors(errorMessages))
      return
    }

    setIsSubmitting(true)

    try {
      // SWR mutate를 사용한 낙관적 업데이트
      await mutate(
        '/api/news-letter',
        async (currentData: PostContents[] | undefined) => {
          // 서버에 POST 요청
          const response = await fetch('/api/news-letter', {
            method: 'POST',
            body: JSON.stringify({
              title: title.trim(),
              content: content.trim(),
              category: category.trim() || undefined,
              tags: tags,
              postType: 'news',
              thumbnailUrl,
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

          const newPostContents = await response.json()

          // ✅ 성공 케이스
          showSuccessToast('성공적으로 저장되었습니다!')
          router.push('/news-letter')

          // 새로운 데이터를 캐시에 추가 (낙관적 업데이트)
          if (Array.isArray(currentData)) {
            return [newPostContents, ...currentData]
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
  }, [title, content, category, tags, session?.user?.id, mutate, router])

  if (!session) {
    return <div />
  }

  return (
    <div className="space-y-5">
      <PageBreadcrumb
        items={[
          { label: '뉴스레터', href: '/news-letter' },
          { label: '뉴스 작성하기' },
        ]}
      />

      {/* 제목 입력 필드 */}
      <div className="space-y-1">
        <Label htmlFor="title" className="text-sm font-medium">
          제목 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full !text-lg h-12 mt-1"
        />
      </div>

      {/* 에디터 */}
      <div className="border rounded-lg overflow-hidden pb-2">
        <SimpleEditor
          onContentChange={(newContent) => setContent(newContent)}
        />
      </div>

      {/* 썸네일 업로드 */}
      <div className="space-y-1">
        <Label htmlFor="thumbnail" className="text-sm font-medium">
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

      {/* 카테고리 입력 */}
      <div className="space-y-1">
        <Label htmlFor="category" className="text-sm font-medium">
          카테고리
        </Label>
        <Input
          id="category"
          type="text"
          placeholder="카테고리를 입력하세요 (예: 기술, 비즈니스, 트렌드 등)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full mt-1"
        />
      </div>

      {/* 태그 입력 */}
      <TagInput
        tags={tags}
        onTagsChange={setTags}
        maxTags={MAX_TAGS_COUNT}
        className="mt-6"
      />

      {/* 저장 버튼 */}
      <FixedBottomButtons
        buttons={[
          {
            onClick: () => {
              if (confirm('정말로 취소하시겠습니까?') === false) return
              router.push(`/news-letter`)
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
