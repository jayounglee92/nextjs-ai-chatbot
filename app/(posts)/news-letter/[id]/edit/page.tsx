'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams, forbidden } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { ThumbnailUpload } from '@/components/thumbnail-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorPage } from '@/components/error-page'
import { TagInput } from '@/components/tag-input'
import {
  handleFetchError,
  handleApiError,
  showSuccessToast,
} from '@/lib/toast-utils'
import { FixedBottomButtons } from '@/components/fixed-bottom-buttons'
import useSWR, { useSWRConfig } from 'swr'
import { fetcher, formatValidationErrors } from '@/lib/utils'
import { handleImageUpload } from '@/lib/tiptap-utils'
import { validatePostContentsUpdate } from '@/lib/validators/post-contents'
import { toast } from 'sonner'
import { EditorFormSkeleton } from '@/components/editor-form-skeleton'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { USER_TYPES } from '@/app/(auth)/auth'

interface PostDetailData {
  id: string
  postId: string
  content: string
  category: string | null
  tags: string[]
  userId: string
  title: string
  thumbnailUrl: string | null
  createdAt: Date
  updatedAt: Date
  userEmail: string
}

export default function Page() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()

  if (
    status === 'authenticated' &&
    !session?.user.types.includes(USER_TYPES.AI_ADMIN)
  ) {
    forbidden()
  }

  const { mutate } = useSWRConfig()
  const [title, setTitle] = useState<string | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [tags, setTags] = useState<string[] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // SWR을 사용하여 뉴스 데이터 조회
  const {
    data: newsPost,
    error,
    isLoading,
  } = useSWR<PostDetailData>(
    session && params.id ? `/api/post?id=${params.id}` : null,
    fetcher,
    {
      onSuccess: (data) => {
        // 초기값 설정 시에만 서버 데이터를 사용
        if (title === null) {
          setTitle(data.title || '')
        }
        if (content === null) {
          setContent(data.content || '')
        }
        if (thumbnailUrl === null) {
          setThumbnailUrl(data.thumbnailUrl || '')
        }
        if (category === null) {
          setCategory(data.category || '')
        }
        if (tags === null) {
          setTags(data.tags || [])
        }
      },
      onError: (error) => {
        console.error('Failed to fetch news post:', error)
      },
    },
  )

  // 실제 사용할 값들 계산
  const currentTitle = title !== null ? title : newsPost?.title
  const currentContent = content !== null ? content : newsPost?.content
  const currentThumbnailUrl =
    thumbnailUrl !== null ? thumbnailUrl : newsPost?.thumbnailUrl
  const currentCategory = category !== null ? category : newsPost?.category
  const currentTags = tags !== null ? tags : newsPost?.tags || []
  const isDisabledSaveButton =
    isSubmitting || !currentTitle?.trim() || !currentThumbnailUrl

  const handleSubmit = async () => {
    const payload = {
      title: currentTitle?.trim(),
      content: currentContent,
      category: currentCategory?.trim(),
      tags: currentTags,
      thumbnailUrl: currentThumbnailUrl,
      postType: 'news',
      openType: 'page',
    }
    // 유효성 검사
    const validation = validatePostContentsUpdate(payload)

    if (!validation.success) {
      const errorMessages = validation.error.errors.map((err) => err.message)
      alert(formatValidationErrors(errorMessages))
      return
    }

    setIsSubmitting(true)

    try {
      // SWR mutate를 사용한 낙관적 업데이트
      await mutate(
        `/api/post?id=${params.id}`,
        async (currentData: PostDetailData | undefined) => {
          // 서버에 PUT 요청
          const response = await fetch(`/api/post?id=${params.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })

          if (!response.ok) {
            await handleApiError(response, router, {
              forbiddenMessage: '본인이 작성한 뉴스만 수정할 수 있습니다',
              notFoundMessage: '삭제되었거나 존재하지 않는 뉴스입니다',
              validationMessage:
                '제목과 내용을 올바르게 입력했는지 확인해보세요',
            })
            // 에러 시 기존 데이터 유지
            return currentData
          }

          const updatedNews = await response.json()

          // ✅ 성공 케이스
          showSuccessToast('성공적으로 수정되었습니다!')
          router.push(`/news-letter/${params.id}`)

          // 업데이트된 데이터를 캐시에 반영 (낙관적 업데이트)
          return updatedNews
        },
        {
          // 자동 재검증 활성화 (서버에서 최신 데이터 확인)
          revalidate: true,
        },
      )

      // 목록 캐시도 업데이트 (수정된 항목이 목록에서도 반영되도록)
      mutate('/api/post')
    } catch (error) {
      // 네트워크 오류나 기타 런타임 오류 처리
      handleFetchError(error, router, '수정')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || status === 'loading') {
    return <EditorFormSkeleton />
  }

  if (error) {
    return ErrorPage({
      title: '오류가 발생했습니다',
      description: error.message || '뉴스를 불러오는데 실패했습니다.',
      actions: (
        <Button onClick={() => router.push('/news-letter')}>목록으로</Button>
      ),
    })
  }

  if (!newsPost) {
    return ErrorPage({
      title: '뉴스를 찾을 수 없습니다',
      description: '요청하신 ID의 뉴스가 존재하지 않습니다.',
      actions: (
        <Button onClick={() => router.push('/news-letter')}>목록으로</Button>
      ),
    })
  }

  return (
    <div className="space-y-5">
      <PageBreadcrumb
        items={[
          { label: '뉴스레터', href: '/news-letter' },
          { label: '수정하기' },
        ]}
      />

      {/* 제목 입력 필드 */}
      <div className="mb-6">
        <Label htmlFor="title" className="sr-only">
          제목
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="제목을 입력하세요"
          value={currentTitle || ''}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full !text-lg h-12"
        />
      </div>

      {/* 에디터 */}
      <div className="border rounded-lg overflow-hidden pb-2 mb-6">
        <SimpleEditor
          onContentChange={(newContent) => setContent(newContent)}
          initialContent={currentContent}
        />
      </div>

      {/* 썸네일 업로드 */}
      <div className="flex gap-4 mb-6">
        <Label className="text-sm font-medium block break-keep">
          썸네일 이미지 <span className="text-red-500">*</span>
        </Label>
        <ThumbnailUpload
          imageUrl={currentThumbnailUrl || undefined}
          onImageChange={setThumbnailUrl}
          aspectRatio="16:9"
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
          value={currentCategory || ''}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full"
        />
      </div>

      {/* 태그 입력 */}
      <div className="mb-6">
        <TagInput
          tags={currentTags}
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
              if (confirm('정말로 취소하시겠습니까?')) {
                router.push(`/news-letter/${params.id}`)
              }
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
