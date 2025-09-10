'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams, redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { ThumbnailUpload } from '@/components/thumbnail-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorPage } from '@/components/error-page'
import { LearningCenterEditSkeleton } from './skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  handleFetchError,
  handleApiError,
  showSuccessToast,
} from '@/lib/toast-utils'
import { FixedBottomButtons } from '@/components/fixed-bottom-buttons'
import useSWR, { useSWRConfig } from 'swr'
import { fetcher, formatValidationErrors } from '@/lib/utils'
import sanitizeHtml from 'sanitize-html'
import { handleImageUpload } from '@/lib/tiptap-utils'
import { postContentsUpdateSchema } from '@/lib/validators/post-contents'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronRightIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { YoutubePreview } from '@/components/youtube-preview'
import { useYoutubeVideo } from '@/hooks/use-youtube-video'
import * as React from 'react'

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

const MAX_TAGS_COUNT = 6

export default function LearningCenterEditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { mutate } = useSWRConfig()

  // 폼 상태
  const [title, setTitle] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [tags, setTags] = useState<string[] | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const {
    videoId,
    videoIdError,
    isCheckingVideo,
    videoExists,
    handleVideoIdChange,
  } = useYoutubeVideo()

  // SWR을 사용하여 학습센터 데이터 조회
  const {
    data: learningCenter,
    error,
    isLoading,
  } = useSWR(
    session && params.id ? `/api/post?id=${params.id}` : null,
    fetcher,
    {
      onSuccess: async (data) => {
        // 초기값 설정 시에만 서버 데이터를 사용
        if (title === null) {
          setTitle(data.title || '')
        }
        if (content === null) {
          setContent(data.content || '')
        }
        if (category === null) {
          setCategory(data.category || '')
        }
        if (thumbnailUrl === null) {
          setThumbnailUrl(data.thumbnailUrl || '')
        }
        if (videoId === '') {
          // 기존 비디오 ID가 있으면 자동으로 검증
          if (data.videoId) {
            handleVideoIdChange(data.videoId)
          }
        }
        if (tags === null) {
          setTags(data.tags || [])
        }
      },
      onError: (error) => {
        console.error('Failed to fetch learning center:', error)
      },
    },
  )

  // 실제 사용할 값들 계산
  const currentTitle = React.useMemo(
    () => (title !== null ? title : learningCenter?.title),
    [title, learningCenter?.title],
  )
  const currentContent = React.useMemo(
    () => (content !== null ? content : learningCenter?.content),
    [content, learningCenter?.content],
  )
  const currentCategory = React.useMemo(
    () => (category !== null ? category : learningCenter?.category),
    [category, learningCenter?.category],
  )
  const currentThumbnailUrl = React.useMemo(
    () => (thumbnailUrl !== null ? thumbnailUrl : learningCenter?.thumbnailUrl),
    [thumbnailUrl, learningCenter?.thumbnailUrl],
  )
  const currentTags = React.useMemo(
    () => (tags !== null ? tags : learningCenter?.tags || []),
    [tags, learningCenter?.tags],
  )

  // 유효성 검사
  const isDisabledSaveButton = React.useMemo(
    () =>
      isSubmitting ||
      !currentTitle?.trim() ||
      sanitizeHtml(currentContent || '', {
        allowedTags: [],
        allowedAttributes: {},
      }).length === 0 ||
      !currentCategory?.trim() ||
      !currentThumbnailUrl ||
      !videoId?.trim() ||
      !!videoIdError,
    [
      isSubmitting,
      currentTitle,
      currentContent,
      currentCategory,
      currentThumbnailUrl,
      videoId,
      videoIdError,
    ],
  )

  // 태그 입력 핸들러
  const addTag = React.useCallback(() => {
    let trimmedTag = tagInput.trim()

    // 맨 앞의 모든 # 제거
    trimmedTag = trimmedTag.replace(/^#+/, '').trim()

    if (
      trimmedTag &&
      !currentTags.includes(trimmedTag) &&
      currentTags.length < MAX_TAGS_COUNT
    ) {
      setTags([...currentTags, trimmedTag])
      setTagInput('')
    }
  }, [tagInput, currentTags])

  const removeTag = React.useCallback(
    (tagToRemove: string) => {
      setTags(currentTags.filter((tag: string) => tag !== tagToRemove))
    },
    [currentTags],
  )

  const handleTagInputKeyUp = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        addTag()
      }
    },
    [addTag],
  )

  const handleSubmit = React.useCallback(async () => {
    // 유효성 검사
    const validation = postContentsUpdateSchema.safeParse({
      title: currentTitle?.trim() || '',
      content: currentContent?.trim() || '',
      category: currentCategory?.trim() || '',
      thumbnailUrl: currentThumbnailUrl || undefined,
      tags: currentTags,
    })

    if (!validation.success) {
      alert(
        formatValidationErrors(validation.error.errors.map((e) => e.message)),
      )
      return
    }

    setIsSubmitting(true)

    try {
      // 서버에 PUT 요청
      const response = await fetch(`/api/post?id=${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: currentTitle?.trim() || '',
          content: currentContent?.trim() || '',
          category: currentCategory?.trim() || '',
          thumbnailUrl: currentThumbnailUrl || undefined,
          tags: currentTags,
        }),
      })

      if (!response.ok) {
        await handleApiError(response, router, {
          forbiddenMessage: '본인이 작성한 학습센터 항목만 수정할 수 있습니다',
          notFoundMessage: '삭제되었거나 존재하지 않는 학습센터 항목입니다',
          validationMessage: '모든 필드를 올바르게 입력했는지 확인해보세요',
        })
        return
      }

      // ✅ 성공 케이스
      showSuccessToast('성공적으로 수정되었습니다!')
      router.push(`/learning-center`)

      // 목록 캐시도 업데이트 (수정된 항목이 목록에서도 반영되도록)
      mutate('/api/post?postType=learningcenter')
    } catch (error) {
      // 네트워크 오류나 기타 런타임 오류 처리
      handleFetchError(error, router, '수정')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    currentTitle,
    currentContent,
    currentCategory,
    currentThumbnailUrl,
    videoId,
    currentTags,
    params.id,
    mutate,
    router,
  ])

  const handleDelete = React.useCallback(async () => {
    if (!confirm('정말로 삭제하시겠습니까?')) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/post?id=${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showSuccessToast('학습센터 항목이 삭제되었습니다!')
        // 목록 캐시 업데이트
        mutate('/api/post?postType=learningcenter')
        router.push('/learning-center')
      } else {
        await handleApiError(response, router, {
          forbiddenMessage: '본인이 작성한 학습센터 항목만 삭제할 수 있습니다',
          notFoundMessage:
            '이미 삭제되었거나 존재하지 않는 학습센터 항목입니다',
        })
      }
    } catch (error) {
      handleFetchError(error, router, '삭제')
    } finally {
      setIsDeleting(false)
    }
  }, [params.id, mutate, router])

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      redirect('/login')
    }
  }, [session, status, router])

  if (status === 'loading' || isLoading) {
    return <LearningCenterEditSkeleton />
  }

  if (error) {
    return ErrorPage({
      title: '오류가 발생했습니다',
      description: error.message || '학습센터 항목을 불러오는데 실패했습니다.',
      actions: (
        <Button onClick={() => router.push('/learning-center')}>
          목록으로
        </Button>
      ),
    })
  }

  if (!learningCenter) {
    return ErrorPage({
      title: '학습센터 항목을 찾을 수 없습니다',
      description: '요청하신 ID의 학습센터 항목이 존재하지 않습니다.',
      actions: (
        <Button onClick={() => router.push('/learning-center')}>
          목록으로
        </Button>
      ),
    })
  }

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
        <span className="text-foreground">수정하기</span>
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
          value={currentTitle}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mt-1"
        />
      </div>

      {/* 내용 입력 필드 */}
      {/* 에디터 */}
      <div className="border rounded-lg overflow-hidden pb-2">
        <SimpleEditor
          onContentChange={(newContent) => setContent(newContent)}
          initialContent={currentContent}
        />
      </div>

      {/* 카테고리 선택 */}
      <div>
        <Label htmlFor="category" className="text-sm font-medium">
          카테고리 <span className="text-red-500">*</span>
        </Label>
        <Select value={currentCategory} onValueChange={setCategory}>
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
            disabled={!tagInput.trim() || currentTags.length >= MAX_TAGS_COUNT}
          >
            추가
          </Button>
        </div>

        {/* 태그 뱃지들 */}
        {currentTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {currentTags.map((tag: string) => (
              <Badge
                key={tag}
                variant="secondary"
                className="inline-flex items-center pl-3 pr-2 py-1 bg-gray-100 border border-dashed border-gray-300 text-sm"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 size-4 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {currentTags.length >= MAX_TAGS_COUNT && (
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
            imageUrl={currentThumbnailUrl || undefined}
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
              if (confirm('정말로 취소하시겠습니까?')) {
                router.push(`/learning-center`)
              }
            },
            text: '취소',
            variant: 'outline',
            disabled: isSubmitting || isDeleting,
          },
          {
            onClick: handleDelete,
            disabled: isSubmitting || isDeleting,
            isLoading: isDeleting,
            loadingText: '삭제중...',
            text: '삭제',
            variant: 'destructive',
          },
          {
            onClick: handleSubmit,
            disabled: isDisabledSaveButton || isDeleting,
            isLoading: isSubmitting,
            loadingText: '저장중...',
            text: '저장하기',
          },
        ]}
      />
    </div>
  )
}
