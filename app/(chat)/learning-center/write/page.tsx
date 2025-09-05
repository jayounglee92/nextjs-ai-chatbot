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
import { ChevronRightIcon } from 'lucide-react'
import { TagInput } from '@/components/tag-input'
import { MAX_TAGS_COUNT } from '../../api/learning-center/schema'
import { YoutubePreview } from '@/components/youtube-preview'
import { useYoutubeVideo } from '@/hooks/use-youtube-video'

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
  const [tags, setTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    videoId,
    videoIdError,
    isCheckingVideo,
    videoExists,
    handleVideoIdChange,
  } = useYoutubeVideo()

  // 유효성 검사
  const isDisabledSaveButton = React.useMemo(
    () =>
      isSubmitting ||
      !title?.trim() ||
      !description?.trim() ||
      !category?.trim() ||
      !thumbnailUrl ||
      !videoId?.trim() ||
      !!videoIdError,
    [
      isSubmitting,
      title,
      description,
      category,
      thumbnailUrl,
      videoId,
      videoIdError,
    ],
  )

  if (!session) {
    return <div />
  }

  const handleSubmit = React.useCallback(async () => {
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
  }, [
    title,
    description,
    category,
    thumbnailUrl,
    videoId,
    tags,
    mutate,
    router,
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link
          href="/learning-center"
          className="hover:text-foreground transition-colors"
        >
          학습센터
        </Link>
        <ChevronRightIcon className="size-4" />
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
          onChange={(e) => handleVideoIdChange(e.target.value)}
          className={`w-full mt-1 ${videoIdError ? 'border-red-500 focus:border-red-500' : ''}`}
        />
        <YoutubePreview
          videoId={videoId}
          videoIdError={videoIdError}
          isCheckingVideo={isCheckingVideo}
          videoExists={videoExists}
        />
      </div>

      {/* 태그 입력 */}
      <TagInput tags={tags} onTagsChange={setTags} maxTags={MAX_TAGS_COUNT} />

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
