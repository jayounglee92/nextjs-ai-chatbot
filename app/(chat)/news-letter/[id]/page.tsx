import { auth, USER_TYPES } from '@/app/(auth)/auth'
import { forbidden } from 'next/navigation'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { getPostById } from '@/lib/db/queries'
import { NewsActions } from './news-actions'
import { PostMetaInfo } from '@/components/post-meta-info'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import Link from 'next/link'

// API에서 받는 데이터 타입 (JOIN 결과)
interface PostDetailData {
  id: string
  postId: string
  content: string
  category: string | null
  tags: string[]
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  userEmail: string
  readingTime: number
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const session = await auth()

  if (!session?.user.types.includes(USER_TYPES.AI_ADMIN)) {
    forbidden()
  }

  const { id } = await params
  let post: PostDetailData | null = null

  try {
    post = (await getPostById({ id })) as PostDetailData | null
  } catch (error) {
    console.error('Failed to fetch news post:', error)
    post = null
  }

  if (!post) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            뉴스를 찾을 수 없습니다
          </h1>
          <p className="text-muted-foreground mb-4">
            요청하신 ID의 뉴스가 존재하지 않습니다.
          </p>
          <Link
            href="/news-letter"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            목록으로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1">
      {/* 제목 */}
      <div>
        <PageBreadcrumb items={[{ label: '뉴스레터', href: '/news-letter' }]} />
        <h1 className="text-4xl font-bold text-foreground my-6">
          {post.title}
        </h1>

        {/* 메타 정보 */}
        <div className="flex justify-between">
          <PostMetaInfo
            items={[
              { type: 'relativeTime', data: post.createdAt },
              { type: 'readingTime', data: post.readingTime },
            ]}
          />
          <NewsActions postId={post.postId} />
        </div>

        {/* 태그 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
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
      {/* 컨텐츠 */}

      <SimpleEditor viewMode={true} initialContent={post.content} />
    </div>
  )
}
