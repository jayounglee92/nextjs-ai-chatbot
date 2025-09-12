import { redirect } from 'next/navigation'
import { auth, USER_TYPES } from '@/app/(auth)/auth'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { getPostById } from '@/lib/db/queries'
import { PostForm } from '@/components/post-form'
import { InfoLayout } from '@/components/info-layout'
import type { Metadata, ResolvingMetadata } from 'next'
import { generateEditMetadata } from '@/lib/metadata-utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params
  return generateEditMetadata({ id, parent, pageType: 'learning-center' })
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
      <InfoLayout
        title="학습센터를 찾을 수 없습니다"
        description="요청하신 ID의 학습자료가 존재하지 않습니다."
        backLink="/learning-center"
      />
    )
  }

  if (learningData.visibility === 'private') {
    return (
      <InfoLayout
        title="비공개 게시물입니다"
        description="비공개 게시물은 수정할 수 없습니다."
        backLink="/learning-center"
      />
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
          visibility: learningData.visibility,
          summaryType: learningData.summaryType || 'auto_truncated',
          summary: learningData.summary || '',
        }}
      />
    </div>
  )
}
