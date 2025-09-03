'use client'

import { useSession } from 'next-auth/react'
import { ThumbnailUpload } from '@/components/thumbnail-upload'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FixedBottomButtons } from '@/components/fixed-bottom-buttons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSWRConfig } from 'swr'
import {
  handleFetchError,
  handleApiError,
  showSuccessToast,
} from '@/lib/toast-utils'
import type { LearningCenter } from '@/lib/db/schema'
import { validateLearningCenterCreate } from '@/lib/validators/learning-center'
import { formatValidationErrors } from '@/lib/utils'
import { handleImageUpload } from '@/lib/tiptap-utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronRightIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MAX_TAGS_COUNT } from '../../api/learning-center/schema'

// 카테고리 옵션들
const CATEGORY_OPTIONS = [
  'Frontend',
  'Backend',
  'Fullstack',
  'Language',
  'AI & Tools',
  'Build Tools',
  'CSS',
  'Database',
  'DevOps',
  'Mobile',
  'Other',
]

export default function LearningCenterWritePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { mutate } = useSWRConfig()

  // 폼 상태
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [videoId, setVideoId] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 태그 입력 핸들러
  const addTag = React.useCallback(() => {
    let trimmedTag = tagInput.trim()

    // 맨 앞의 모든 # 제거
    trimmedTag = trimmedTag.replace(/^#+/, '').trim()

    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      tags.length < MAX_TAGS_COUNT
    ) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }, [tagInput, tags])

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleTagInputKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      addTag()
    }
  }

  // 유효성 검사
  const isDisabledSaveButton =
    isSubmitting ||
    !title?.trim() ||
    !description?.trim() ||
    !category?.trim() ||
    !thumbnailUrl ||
    !videoId?.trim()

  if (!session) {
    return <div />
  }

  const handleSubmit = async () => {
    // 유효성 검사
    const validation = validateLearningCenterCreate({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      thumbnail: thumbnailUrl || '',
      videoId: videoId.trim(),
      tags: tags,
    })

    if (!validation.success) {
      alert(formatValidationErrors(validation.errors || ['유효성 검사 실패']))
      return
    }

    setIsSubmitting(true)

    try {
      // SWR mutate를 사용한 낙관적 업데이트
      await mutate(
        '/api/learning-center',
        async (currentData: LearningCenter[] | undefined) => {
          // 서버에 POST 요청
          const response = await fetch('/api/learning-center', {
            method: 'POST',
            body: JSON.stringify({
              title: title.trim(),
              description: description.trim(),
              category: category.trim(),
              thumbnail: thumbnailUrl || undefined,
              videoId: videoId.trim(),
              tags: tags,
            }),
          })

          if (!response.ok) {
            await handleApiError(response, router, {
              forbiddenMessage: '로그인이 필요합니다',
              validationMessage: '모든 필드를 올바르게 입력했는지 확인해보세요',
            })
            // 에러 시 기존 데이터 유지
            return currentData
          }

          const newLearningCenter = await response.json()

          // ✅ 성공 케이스
          showSuccessToast('성공적으로 저장되었습니다!')
          router.push('/learning-center')

          // 새로운 데이터를 캐시에 추가 (낙관적 업데이트)
          if (Array.isArray(currentData)) {
            return [newLearningCenter, ...currentData]
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
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link
          href="/learning-center"
          className="hover:text-foreground transition-colors"
        >
          학습센터
        </Link>
        <ChevronRightIcon className="h-4 w-4" />
        <span className="text-foreground">동영상 올리기</span>
      </nav>

      {/* 제목 입력 필드 */}
      <div>
        <Label htmlFor="title" className="text-sm font-medium">
          제목 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="학습 자료의 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mt-1"
        />
      </div>

      {/* 설명 입력 필드 */}
      <div>
        <Label htmlFor="description" className="text-sm font-medium">
          설명 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="학습 자료에 대한 설명을 입력하세요"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mt-1 min-h-[100px]"
        />
      </div>

      {/* 카테고리 선택 */}
      <div>
        <Label htmlFor="category" className="text-sm font-medium">
          카테고리 <span className="text-red-500">*</span>
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder="카테고리를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 비디오 ID 입력 */}
      <div>
        <Label htmlFor="videoId" className="text-sm font-medium">
          비디오 ID <span className="text-red-500">*</span>
        </Label>
        <Input
          id="videoId"
          type="text"
          placeholder="YouTube 비디오 ID를 입력하세요 (예: dQw4w9WgXcQ)"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          className="w-full mt-1"
        />
      </div>

      {/* 태그 입력 */}
      <div>
        <Label className="text-sm font-medium">태그</Label>

        {/* 태그 입력 필드 */}
        <div className="mt-1 flex gap-2">
          <Input
            type="text"
            placeholder="태그입력"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyUp={handleTagInputKeyUp}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={addTag}
            disabled={!tagInput.trim() || tags.length >= MAX_TAGS_COUNT}
          >
            추가
          </Button>
        </div>

        {/* 태그 뱃지들 */}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="inline-flex items-center pl-3 pr-2 py-1 bg-gray-100 border border-dashed border-gray-300 text-sm"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 w-4 h-4 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {tags.length >= MAX_TAGS_COUNT && (
          <p className="mt-2 text-sm text-red-600">
            최대 {MAX_TAGS_COUNT}개의 태그까지 추가할 수 있습니다.
          </p>
        )}
      </div>

      {/* 썸네일 업로드 */}
      <div className="w-fit">
        <Label className="text-sm font-medium">
          썸네일 이미지 <span className="text-red-500">*</span>
        </Label>
        <div className="mt-1">
          <ThumbnailUpload
            imageUrl={thumbnailUrl || undefined}
            onImageChange={setThumbnailUrl}
            aspectRatio="16:9"
            maxHeight={180}
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
      </div>

      {/* 저장 버튼 */}
      <FixedBottomButtons
        buttons={[
          {
            onClick: () => {
              if (confirm('정말로 취소하시겠습니까?') === false) return
              router.push(`/learning-center`)
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
