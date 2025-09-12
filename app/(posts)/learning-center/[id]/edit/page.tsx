import { redirect } from 'next/navigation'
import { auth, USER_TYPES } from '@/app/(auth)/auth'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { getPostById } from '@/lib/db/queries'
import Link from 'next/link'
import { PostForm } from '@/components/post-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const session = await auth()
  const { id } = await params

  if (!session?.user.types.includes(USER_TYPES.AI_ADMIN)) {
    redirect('/forbidden')
  }

  let learningData = null

  try {
    learningData = await getPostById({ id })
  } catch (error) {
    console.error('Failed to fetch AI use case:', error)
    learningData = null
  }

  if (!learningData) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            학습센터를 찾을 수 없습니다
          </h1>
          <p className="text-muted-foreground mb-4">
            요청하신 ID의 학습자료가 존재하지 않습니다.
          </p>
          <Link
            href="/learning-center"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            목록으로
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageBreadcrumb
        items={[
          { label: '학습센터', href: '/learning-center' },
          { label: '수정하기' },
        ]}
      />

      <PostForm
        mode="edit"
        postType="learningcenter"
        initialData={{
          id: learningData.postId,
          title: learningData.title || '',
          content: learningData.content || '',
          thumbnailUrl: learningData.thumbnailUrl || '',
          category: learningData.category || '',
          tags: learningData.tags || [],
          openType: learningData.openType,
        }}
      />
    </div>
  )
}
