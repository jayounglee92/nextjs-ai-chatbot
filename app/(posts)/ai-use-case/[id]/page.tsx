import { auth } from '@/app/(auth)/auth'
import { redirect } from 'next/navigation'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { getPostById } from '@/lib/db/queries'
import Link from 'next/link'
import { AiUseCaseActions } from './ai-use-case-actions'
import { PostMetaInfo } from '@/components/post-meta-info'
import { PageBreadcrumb } from '@/components/page-breadcrumb'

// API에서 받는 데이터 타입 (getPostById 반환 타입)
interface PostDetailData {
  id: string
  postId: string
  content: string
  category: string | null
  tags: string[]
  userId: string
  title: string | null
  thumbnailUrl: string | null
  createdAt: Date | null
  updatedAt: Date | null
  userEmail: string | null
  readingTime: number
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  let useCase: PostDetailData | null = null

  try {
    useCase = await getPostById({ id })
  } catch (error) {
    console.error('Failed to fetch AI use case:', error)
    useCase = null
  }

  if (!useCase) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            AI 활용 사례를 찾을 수 없습니다
          </h1>
          <p className="text-muted-foreground mb-4">
            요청하신 ID의 AI 활용 사례가 존재하지 않습니다.
          </p>
          <Link
            href="/ai-use-case"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            목록으로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1">
        {/* 제목 */}
        <div>
          <PageBreadcrumb
            items={[{ label: 'AI 활용 사례', href: '/ai-use-case' }]}
          />
          <h1 className="text-4xl font-bold text-foreground my-6">
            {useCase.title}
          </h1>

          {/* 메타 정보 */}
          <div className="flex justify-between">
            <PostMetaInfo
              items={[
                { type: 'author', data: { email: useCase.userId } },
                { type: 'readingTime', data: useCase.readingTime },
                { type: 'relativeTime', data: useCase.createdAt },
              ]}
            />
            <AiUseCaseActions useCase={useCase} />
          </div>
          {/* 태그 */}
          {useCase.tags && useCase.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {useCase.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <hr className="my-10 border-t-2 border-primary" />
        <SimpleEditor viewMode={true} initialContent={useCase.content} />
      </div>
    </div>
  )
}
