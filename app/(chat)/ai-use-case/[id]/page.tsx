'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { aiUseCases, type AiUseCase } from '@/lib/data/ai-use-cases'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronLeft,
  Clock,
  Calendar,
  User,
  BookOpen,
  Share2,
  Heart,
  Bookmark,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function AiUseCaseDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [useCase, setUseCase] = useState<AiUseCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (params.id) {
      const foundUseCase = aiUseCases.find((uc) => uc.id === params.id)
      setUseCase(foundUseCase || null)
      setLoading(false)
    }
  }, [params.id])

  // 관련 AI 활용 사례 추천 (현재 항목 제외)
  const relatedUseCases = aiUseCases
    .filter((uc) => uc.id !== params.id)
    .slice(0, 3)

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: useCase?.title,
        text: useCase?.description,
        url: window.location.href,
      })
    } else {
      // 폴백: URL 복사
      navigator.clipboard.writeText(window.location.href)
      // 토스트 메시지 표시 (실제 구현에서는 toast 라이브러리 사용)
      alert('링크가 클립보드에 복사되었습니다!')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <div />
  }

  if (!useCase) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            AI 활용 사례를 찾을 수 없습니다
          </h2>
          <p className="text-muted-foreground mb-4">
            요청하신 ID의 AI 활용 사례가 존재하지 않습니다.
          </p>
          <Button onClick={() => router.push('/ai-use-case')}>목록으로</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 뒤로가기 버튼 */}
      <Button
        variant="link"
        onClick={() => router.push('/ai-use-case')}
        className="mb-6 -ml-4"
      >
        <ChevronLeft className="h-4 w-4" />
        목록으로
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2">
          {/* 헤더 섹션 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {useCase.title}
            </h1>

            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{useCase.readingTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{useCase.publicationDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{useCase.author}</span>
              </div>
            </div>

            {/* 썸네일 이미지 */}
            <div className="relative w-full h-80 rounded-lg overflow-hidden mb-6">
              <Image
                src={useCase.thumbnail}
                alt={useCase.title}
                fill
                className="object-cover"
              />
            </div>

            {/* 설명 */}
            <p className="text-lg text-foreground leading-relaxed">
              {useCase.description}
            </p>
          </div>

          {/* 콘텐츠 섹션 */}
          <div className="bg-card rounded-lg p-6 border mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                상세 내용
              </h2>
            </div>

            <div className="prose prose-gray max-w-none">
              <p className="text-muted-foreground">
                이 AI 활용 사례에 대한 상세한 내용이 여기에 표시됩니다. 실제
                구현에서는 데이터베이스에서 가져온 상세 콘텐츠를 렌더링하게
                됩니다.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">
                주요 특징
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>AI 기술의 실제 적용 사례</li>
                <li>구체적인 구현 방법과 전략</li>
                <li>성공 사례와 학습 포인트</li>
                <li>향후 발전 방향과 제언</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">
                활용 가능한 분야
              </h3>
              <p className="text-muted-foreground">
                이 AI 활용 사례는 다양한 분야에 적용할 수 있으며, 특히{' '}
                {useCase.title.toLowerCase().includes('ai') ? 'AI' : '기술'}{' '}
                관련 프로젝트에서 참고할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-4">
            <Button className="flex-1">
              <BookOpen className="h-4 w-4 mr-2" />
              전체 내용 읽기
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={
                isBookmarked ? 'bg-primary text-primary-foreground' : ''
              }
            >
              <Bookmark className="h-4 w-4 mr-2" />
              {isBookmarked ? '북마크됨' : '북마크 추가'}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              공유
            </Button>
          </div>
        </div>

        {/* 사이드바 */}
        {/* <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-full mb-2 ${isLiked ? 'text-red-500' : ''}`}
                >
                  <Heart
                    className={`h-5 w-5 mr-2 ${isLiked ? 'fill-current' : ''}`}
                  />
                  {isLiked ? '좋아요 취소' : '좋아요'}
                </Button>
                <div className="text-sm text-muted-foreground">
                  <div>읽기 시간: {useCase.readingTime}</div>
                  <div>발행일: {useCase.publicationDate}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-4">
                관련 AI 활용 사례
              </h3>
              <div className="space-y-3">
                {relatedUseCases.map((relatedCase) => (
                  <Link
                    key={relatedCase.id}
                    href={`/ai-use-case/${relatedCase.id}`}
                    className="block hover:bg-muted rounded-lg p-2 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-16 h-16 bg-muted rounded overflow-hidden">
                        <Image
                          src={relatedCase.thumbnail}
                          alt={relatedCase.title}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground leading-tight line-clamp-2">
                          {relatedCase.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{relatedCase.readingTime}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>
    </div>
  )
}
