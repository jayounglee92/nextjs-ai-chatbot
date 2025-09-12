'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { ThumbnailUpload } from '@/components/thumbnail-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FixedBottomButtons } from '@/components/fixed-bottom-buttons'
import { useSWRConfig } from 'swr'
import {
  handleFetchError,
  handleApiError,
  showSuccessToast,
} from '@/lib/toast-utils'
import {
  validatePostContentsCreate,
  validatePostContentsUpdate,
} from '@/lib/validators/post-contents'
import { formatValidationErrors } from '@/lib/utils'
import { handleImageUpload } from '@/lib/tiptap-utils'
import { toast } from 'sonner'
import { TagInput } from '@/components/tag-input'
import {
  type PostType,
  type OpenType,
  POST_TYPE,
} from '@/lib/validators/post-contents'

interface PostFormProps {
  mode: 'create' | 'edit'
  initialData?: {
    id?: string
    title?: string
    content?: string
    thumbnailUrl?: string
    category?: string
    tags?: string[]
    openType: OpenType
  }
  postType: PostType
}

export function PostForm({ mode, postType, initialData }: PostFormProps) {
  const router = useRouter()
  const { mutate } = useSWRConfig()

  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    initialData?.thumbnailUrl || null,
  )
  const [category, setCategory] = useState(initialData?.category || '')
  const [tags, setTags] = useState(initialData?.tags || [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDisabledSaveButton = isSubmitting || !title?.trim() || !thumbnailUrl

  const handleCreate = async () => {
    const payload = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      tags,
      thumbnailUrl,
      postType,
      openType: POST_TYPE[postType].openType,
    }

    const validation = validatePostContentsCreate(payload)

    if (!validation.success) {
      const errorMessages = validation.error.errors.map((err) => err.message)
      alert(formatValidationErrors(errorMessages))
      return
    }

    setIsSubmitting(true)

    try {
      await mutate(
        '/api/post',
        async (currentData: any) => {
          const response = await fetch('/api/post', {
            method: 'POST',
            body: JSON.stringify(payload),
          })

          if (!response.ok) {
            await handleApiError(response, router, {
              forbiddenMessage: '로그인이 필요합니다',
              validationMessage:
                '제목과 내용을 올바르게 입력했는지 확인해보세요',
            })
            return currentData
          }

          const result = await response.json()
          showSuccessToast('성공적으로 저장되었습니다!')

          router.push(`/${POST_TYPE[postType].path}`)

          // 목록 캐시 업데이트
          mutate('/api/post')
          return Array.isArray(currentData)
            ? [result, ...currentData]
            : currentData
        },
        { revalidate: true },
      )
    } catch (error) {
      handleFetchError(error, router, '저장')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    const payload = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      tags,
      thumbnailUrl,
      postType,
      openType: initialData?.openType,
    }

    const validation = validatePostContentsUpdate(payload)

    if (!validation.success) {
      const errorMessages = validation.error.errors.map((err) => err.message)
      alert(formatValidationErrors(errorMessages))
      return
    }

    setIsSubmitting(true)

    try {
      const url = `/api/post?id=${initialData?.id}`

      await mutate(
        url,
        async (currentData: any) => {
          const response = await fetch(url, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })

          if (!response.ok) {
            await handleApiError(response, router, {
              forbiddenMessage: '본인이 작성한 게시물만 수정할 수 있습니다',
              notFoundMessage: '삭제되었거나 존재하지 않는 게시물입니다',
              validationMessage:
                '제목과 내용을 올바르게 입력했는지 확인해보세요',
            })

            return currentData
          }

          const result = await response.json()
          showSuccessToast('성공적으로 수정되었습니다!')

          if (initialData?.openType === 'modal') {
            // 모달의 경우 목록페이지로 이동
            router.back()
          } else {
            router.push(`/${POST_TYPE[postType].path}/${initialData?.id}`)
          }

          // 목록 캐시도 업데이트
          mutate('/api/post')
          return result
        },
        { revalidate: true },
      )
    } catch (error) {
      handleFetchError(error, router, '수정')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = mode === 'create' ? handleCreate : handleUpdate

  return (
    <div className="space-y-5">
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
          className="w-full !text-lg h-12"
        />
      </div>

      {/* 에디터 */}
      <div className="border rounded-lg overflow-hidden pb-2">
        <SimpleEditor
          onContentChange={(newContent) => setContent(newContent)}
          initialContent={mode === 'edit' ? content : undefined}
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
            accept: 'image/jpeg,image/png,image/webp',
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
      <div className="mb-6">
        <Label htmlFor="category" className="text-sm font-medium block mb-2">
          카테고리
        </Label>
        <Input
          id="category"
          type="text"
          placeholder="카테고리를 입력하세요"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full"
        />
      </div>

      {/* 태그 입력 */}
      <div className="mb-6">
        <TagInput
          tags={tags}
          onTagsChange={setTags}
          label="태그"
          placeholder="태그를 입력하고 Enter를 누르세요"
          maxTags={10}
        />
      </div>

      {/* 저장 버튼 */}
      <FixedBottomButtons
        buttons={[
          {
            onClick: () => {
              if (confirm('정말로 취소하시겠습니까?') === false) return
              router.back()
            },
            text: '취소',
            variant: 'outline',
          },
          {
            onClick: handleSubmit,
            disabled: isDisabledSaveButton,
            isLoading: isSubmitting,
            loadingText: '저장중...',
            text: mode === 'create' ? '저장하기' : '수정하기',
          },
        ]}
      />
    </div>
  )
}
