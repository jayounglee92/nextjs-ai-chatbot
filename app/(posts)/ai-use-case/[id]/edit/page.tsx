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
  return generateEditMetadata({ id, parent, pageType: 'ai-use-case' })
}

export default async function Page({ params }: PageProps) {
  const session = await auth()
  const { id } = await params

  if (!session?.user.types.includes(USER_TYPES.AI_ADMIN)) {
    redirect('/forbidden')
  }

  let useCase = null

  try {
    useCase = await getPostById({ id })
  } catch (error) {
    console.error('Failed to fetch AI use case:', error)
    useCase = null
  }

  if (!useCase) {
    return (
      <InfoLayout
        title="AI 활용 사례를 찾을 수 없습니다"
        description="요청하신 ID의 AI 활용 사례가 존재하지 않습니다."
        backLink="/ai-use-case"
      />
    )
  }

  if (useCase.visibility === 'private') {
    return (
      <InfoLayout
        title="비공개 게시물입니다"
        description="비공개 게시물은 수정할 수 없습니다."
        backLink="/ai-use-case"
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageBreadcrumb
        items={[
          { label: 'AI 활용 사례', href: '/ai-use-case' },
          { label: '수정하기' },
        ]}
      />

      <PostForm
        mode="edit"
        postType="aiusecase"
        initialData={{
          id: useCase.postId,
          title: useCase.title || '',
          content: useCase.content || '',
          thumbnailUrl: useCase.thumbnailUrl || '',
          category: useCase.category || '',
          tags: useCase.tags || [],
          openType: useCase.openType,
          visibility: useCase.visibility,
          summaryType: useCase.summaryType || 'auto_truncated',
          summary: useCase.summary || '',
        }}
      />
    </div>
  )
}
