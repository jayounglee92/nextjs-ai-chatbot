'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ThumbnailUpload } from '@/components/thumbnail-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ErrorPage } from '@/components/error-page'
import { LoadingPage } from '@/components/loading-page'
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
import { handleImageUpload } from '@/lib/tiptap-utils'
import type { LearningCenter } from '@/lib/db/schema'
import { validateLearningCenterUpdate } from '@/lib/validators/learning-center'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronRightIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MAX_TAGS_COUNT } from '@/app/(chat)/api/learning-center/schema'
import {
  isValidYouTubeVideoIdFormat,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  checkVideoExistsViaIframe,
} from '@/lib/youtube-utils'
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

export default function LearningCenterEditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { mutate } = useSWRConfig()

  // 폼 상태
  const [title, setTitle] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [tags, setTags] = useState<string[] | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [videoIdError, setVideoIdError] = useState<string | null>(null)
  const [isCheckingVideo, setIsCheckingVideo] = useState(false)
  const [videoExists, setVideoExists] = useState<boolean | null>(null)

  // SWR을 사용하여 학습센터 데이터 조회
  const {
    data: learningCenter,
    error,
    isLoading,
  } = useSWR(
    session && params.id ? `/api/learning-center?id=${params.id}` : null,
    fetcher,
    {
      onSuccess: async (data) => {
        // 초기값 설정 시에만 서버 데이터를 사용
        if (title === null) {
          setTitle(data.title || '')
        }
        if (description === null) {
          setDescription(data.description || '')
        }
        if (category === null) {
          setCategory(data.category || '')
        }
        if (thumbnailUrl === null) {
          setThumbnailUrl(data.thumbnail || '')
        }
        if (videoId === null) {
          setVideoId(data.videoId || '')
          // 기존 비디오 ID가 있으면 존재 여부 확인
          if (data.videoId && isValidYouTubeVideoIdFormat(data.videoId)) {
            setIsCheckingVideo(true)
            try {
              const exists = await checkVideoExistsViaIframe(data.videoId)
              setVideoExists(exists)
              if (!exists) {
                setVideoIdError('이 동영상은 볼 수 없습니다.')
              }
            } catch (error) {
              console.error('비디오 존재 여부 확인 중 오류:', error)
              setVideoExists(false)
              setVideoIdError('비디오 확인 중 오류가 발생했습니다.')
            } finally {
              setIsCheckingVideo(false)
            }
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
  const currentTitle = title !== null ? title : learningCenter?.title
  const currentDescription =
    description !== null ? description : learningCenter?.description
  const currentCategory =
    category !== null ? category : learningCenter?.category
  const currentThumbnailUrl =
    thumbnailUrl !== null ? thumbnailUrl : learningCenter?.thumbnail
  const currentVideoId = videoId !== null ? videoId : learningCenter?.videoId
  const currentTags = tags !== null ? tags : learningCenter?.tags || []

  // 유효성 검사
  const isDisabledSaveButton =
    isSubmitting ||
    !currentTitle?.trim() ||
    !currentDescription?.trim() ||
    !currentCategory?.trim() ||
    !currentThumbnailUrl ||
    !currentVideoId?.trim() ||
    !!videoIdError

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

  const removeTag = (tagToRemove: string) => {
    setTags(currentTags.filter((tag: string) => tag !== tagToRemove))
  }

  const handleTagInputKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      addTag()
    }
  }

  // 비디오 ID 입력 핸들러
  const handleVideoIdChange = async (value: string) => {
    setVideoId(value)
    setVideoExists(null)

    if (!value.trim()) {
      setVideoIdError(null)
      return
    }

    // 직접 입력된 비디오 ID 검증
    if (isValidYouTubeVideoIdFormat(value)) {
      setVideoIdError(null)

      // 실제 비디오 존재 여부 확인
      setIsCheckingVideo(true)
      try {
        const exists = await checkVideoExistsViaIframe(value)
        setVideoExists(exists)
        if (!exists) {
          setVideoIdError('이 동영상은 볼 수 없습니다.')
        }
      } catch (error) {
        console.error('비디오 존재 여부 확인 중 오류:', error)
        setVideoExists(false)
        setVideoIdError('비디오 확인 중 오류가 발생했습니다.')
      } finally {
        setIsCheckingVideo(false)
      }
    } else {
      setVideoIdError(
        '올바른 YouTube 비디오 ID를 입력해주세요. (예: dQw4w9WgXcQ)',
      )
    }
  }

  const handleSubmit = async () => {
    // 유효성 검사
    const validation = validateLearningCenterUpdate({
      title: currentTitle?.trim() || '',
      description: currentDescription?.trim() || '',
      category: currentCategory?.trim() || '',
      thumbnail: currentThumbnailUrl || '',
      videoId: currentVideoId?.trim() || '',
      tags: currentTags,
    })

    if (!validation.success) {
      alert(formatValidationErrors(validation.errors || ['유효성 검사 실패']))
      return
    }

    setIsSubmitting(true)

    try {
      // SWR mutate를 사용한 낙관적 업데이트
      await mutate(
        `/api/learning-center?id=${params.id}`,
        async (currentData: LearningCenter | undefined) => {
          // 서버에 PUT 요청
          const response = await fetch(`/api/learning-center?id=${params.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              title: currentTitle?.trim() || '',
              description: currentDescription?.trim() || '',
              category: currentCategory?.trim() || '',
              thumbnail: currentThumbnailUrl || undefined,
              videoId: currentVideoId?.trim() || '',
              tags: currentTags,
            }),
          })

          if (!response.ok) {
            await handleApiError(response, router, {
              forbiddenMessage:
                '본인이 작성한 학습센터 항목만 수정할 수 있습니다',
              notFoundMessage: '삭제되었거나 존재하지 않는 학습센터 항목입니다',
              validationMessage: '모든 필드를 올바르게 입력했는지 확인해보세요',
            })
            // 에러 시 기존 데이터 유지
            return currentData
          }

          const updatedLearningCenter = await response.json()

          // ✅ 성공 케이스
          showSuccessToast('성공적으로 수정되었습니다!')
          router.push(`/learning-center`)

          // 업데이트된 데이터를 캐시에 반영 (낙관적 업데이트)
          return updatedLearningCenter
        },
        {
          // 자동 재검증 활성화 (서버에서 최신 데이터 확인)
          revalidate: true,
        },
      )

      // 목록 캐시도 업데이트 (수정된 항목이 목록에서도 반영되도록)
      mutate('/api/learning-center')
    } catch (error) {
      // 네트워크 오류나 기타 런타임 오류 처리
      handleFetchError(error, router, '수정')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 삭제하시겠습니까?')) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/learning-center?id=${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showSuccessToast('학습센터 항목이 삭제되었습니다!')
        // 목록 캐시 업데이트
        mutate('/api/learning-center')
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
  }

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  if (status === 'loading' || isLoading) {
    return <LoadingPage />
  }

  if (!session) {
    return <div />
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
      {/* Breadcrumb */}
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

      {/* 설명 입력 필드 */}
      <div>
        <Label htmlFor="description" className="text-sm font-medium">
          설명 <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="학습 자료에 대한 설명을 입력하세요"
          value={currentDescription}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mt-1 min-h-[100px]"
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
          value={currentVideoId}
          onChange={(e) => handleVideoIdChange(e.target.value)}
          className={`w-full mt-1 ${videoIdError ? 'border-red-500 focus:border-red-500' : ''}`}
        />
        {isCheckingVideo && (
          <p className="mt-1 text-sm text-blue-600">비디오 확인 중...</p>
        )}
        {videoIdError && (
          <p className="mt-1 text-sm text-red-600">{videoIdError}</p>
        )}
        {currentVideoId &&
          !videoIdError &&
          !isCheckingVideo &&
          videoExists === true && (
            <p className="mt-1 text-sm text-green-600">
              ✓ 유효한 YouTube 비디오 ID입니다
            </p>
          )}
        {/* 비디오 미리보기 */}
        {currentVideoId &&
          !videoIdError &&
          !isCheckingVideo &&
          videoExists === true && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700">
                비디오 미리보기
              </h4>
              <div className="aspect-video w-full max-w-md">
                <iframe
                  src={getYouTubeEmbedUrl(currentVideoId)}
                  title="YouTube 비디오 미리보기"
                  className="size-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <img
                  src={getYouTubeThumbnailUrl(currentVideoId, 'default')}
                  alt="비디오 썸네일"
                  className="size-12 rounded object-cover"
                />
                <div>
                  <p className="font-medium">YouTube 비디오</p>
                  <p>ID: {currentVideoId}</p>
                </div>
              </div>
            </div>
          )}
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
