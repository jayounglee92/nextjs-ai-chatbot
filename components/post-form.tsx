'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { ThumbnailUpload } from '@/components/thumbnail-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FixedBottomButtons } from '@/components/fixed-bottom-buttons'
import { useSWRConfig } from 'swr'
import {
  handleFetchError,
  handleApiError,
  showSuccessToast,
} from '@/lib/toast-utils'
import {
  type SummaryType,
  validatePostContentsCreate,
  validatePostContentsUpdate,
  type Visibility,
} from '@/lib/validators/post-contents'
import { generateAISummary } from '@/app/(posts)/actions'
import sanitizeHtml from 'sanitize-html'
import { formatValidationErrors } from '@/lib/utils'
import { handleImageUpload } from '@/lib/tiptap-utils'
import { toast } from 'sonner'
import { TagInput } from '@/components/tag-input'
import {
  type PostType,
  type OpenType,
  POST_TYPE,
} from '@/lib/validators/post-contents'
import { Button } from './ui/button'
import { InfoIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

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
    visibility?: Visibility
    summaryType?: SummaryType
    summary?: string
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
  const [visibility, setVisibility] = useState<Visibility>(
    initialData?.visibility || 'private',
  )
  const [summaryType, setSummaryType] = useState<SummaryType>(
    initialData?.summaryType || 'auto_truncated',
  )
  const [aiGeneratedSummary, setAiGeneratedSummary] = useState<string>(
    initialData?.summaryType === 'ai_generated' && initialData?.summary
      ? initialData.summary
      : '',
  )
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDisabledSaveButton = isSubmitting || !title?.trim() || !thumbnailUrl

  const handleGenerateAISummary = async () => {
    if (!content.trim()) {
      toast.error('내용을 먼저 입력해주세요.')
      return
    }

    setIsGeneratingSummary(true)
    try {
      // HTML 태그 제거
      const cleanContent = sanitizeHtml(content, {
        allowedTags: [],
        allowedAttributes: {},
      })

      // AI 요약 생성
      const summary = await generateAISummary({
        content: cleanContent,
      })

      setAiGeneratedSummary(summary)
      toast.success('AI 요약이 생성되었습니다!')
    } catch (error) {
      console.error('AI 요약 생성 실패:', error)
      toast.error('AI 요약 생성에 실패했습니다.')
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleCreate = async () => {
    const payload = {
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      tags,
      thumbnailUrl,
      postType,
      openType: POST_TYPE[postType].openType,
      visibility,
      summaryType,
      summary: summaryType === 'ai_generated' ? aiGeneratedSummary : undefined,
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
      visibility,
      summaryType,
      summary: summaryType === 'ai_generated' ? aiGeneratedSummary : undefined,
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
    <div className="space-y-7">
      {/* 제목 입력 필드 */}
      <div>
        <div className="mb-4">
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

      {/* 요약 설정 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-medium">
            요약 설정 <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="p-1">
                <InfoIcon className="size-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="max-w-fit w-full">
              <div className="space-y-1 text-xs">
                <div>
                  <strong>• 간단 요약 :</strong> 내용에서 앞에 300자 정도 잘린
                  텍스트입니다.
                </div>
                <div>
                  <strong>• AI 요약 :</strong> AI가 요약해서 300자 이내, 3문장
                  이내로 만들어줍니다.
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <RadioGroup
          value={summaryType}
          onValueChange={(value) => setSummaryType(value as SummaryType)}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="auto_truncated" id="auto_truncated" />
            <Label htmlFor="auto_truncated" className="text-sm cursor-pointer">
              간단 요약
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="ai_generated" id="ai_generated" />
            <Label htmlFor="ai_generated" className="text-sm cursor-pointer">
              AI 요약
            </Label>
          </div>
        </RadioGroup>

        {summaryType === 'ai_generated' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleGenerateAISummary}
                disabled={isGeneratingSummary || !content.trim()}
              >
                {isGeneratingSummary ? '생성중...' : 'AI 요약 생성하기'}
              </Button>
              {isGeneratingSummary && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                  <span>AI가 요약을 생성하고 있습니다...</span>
                </div>
              )}
            </div>

            {aiGeneratedSummary && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <Label className="text-sm font-medium block mb-2">
                  생성된 AI 요약
                </Label>
                <p className="text-sm text-foreground leading-relaxed">
                  {aiGeneratedSummary}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 공개 설정 */}
      <div className="mb-6">
        <Label className="text-sm font-medium block mb-3">
          공개 설정 <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={visibility}
          onValueChange={(value) => setVisibility(value as Visibility)}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="public" id="public" />
            <Label htmlFor="public" className="text-sm cursor-pointer">
              공개
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="private" id="private" />
            <Label htmlFor="private" className="text-sm cursor-pointer">
              비공개
            </Label>
          </div>
        </RadioGroup>
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
