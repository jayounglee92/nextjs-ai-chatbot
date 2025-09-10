'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams, redirect } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorPage } from '@/components/error-page'
import { handleFetchError, handleApiError } from '@/lib/toast-utils'
import useSWR from 'swr'
import { fetcher } from '@/lib/utils'
import type { Posts } from '@/lib/db/schema'
import Link from 'next/link'
import { ChevronRightIcon, EditIcon, TrashIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { useSWRConfig } from 'swr'

interface LearningCenterData extends Posts {
  userEmail?: string | null
  tags?: string[]
  category?: string | null
  readingTime?: string
  content?: string
}

export default function LearningCenterDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const { mutate } = useSWRConfig()
  const [isDeleting, setIsDeleting] = useState(false)

  // SWR을 사용하여 학습센터 데이터 조회
  const {
    data: learningCenter,
    error,
    isLoading,
  } = useSWR<LearningCenterData>(
    session && params.id ? `/api/post?id=${params.id}` : null,
    fetcher,
    {
      onError: (error) => {
        console.error('Failed to fetch learning center:', error)
      },
    },
  )

  const handleDelete = async () => {
    if (!confirm('정말로 삭제하시겠습니까?')) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/post?id=${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
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
  }

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      redirect('/login')
    }
  }, [session, status, router])

  if (status === 'loading' || isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />
          <div className="h-64 bg-gray-200 rounded mb-6" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
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

  const isOwner = session?.user?.id === learningCenter.userId

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
        <span className="text-foreground">{learningCenter.title}</span>
      </nav>

      {/* 제목과 메타 정보 */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            {learningCenter.title}
          </h1>
          {isOwner && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/learning-center/${params.id}/edit`)
                }
              >
                <EditIcon className="size-4 mr-2" />
                수정
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <TrashIcon className="size-4 mr-2" />
                {isDeleting ? '삭제중...' : '삭제'}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>작성자: {learningCenter.userEmail || '알 수 없음'}</span>
          <span>카테고리: {learningCenter.category || '미분류'}</span>
          <span>
            작성일:{' '}
            {new Date(learningCenter.createdAt).toLocaleDateString('ko-KR')}
          </span>
        </div>

        {/* 태그 */}
        {learningCenter.tags && learningCenter.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {learningCenter.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 썸네일 이미지 */}
      {learningCenter.thumbnailUrl && (
        <div className="relative">
          <img
            src={learningCenter.thumbnailUrl}
            alt={learningCenter.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* 내용 */}
      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap text-foreground">
          {learningCenter.content}
        </div>
      </div>
    </div>
  )
}
