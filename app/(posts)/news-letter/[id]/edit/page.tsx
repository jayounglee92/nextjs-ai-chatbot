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
  return generateEditMetadata({ id, parent, pageType: 'news-letter' })
}

export default async function Page({ params }: PageProps) {
  const session = await auth()
  const { id } = await params

  if (!session?.user.types.includes(USER_TYPES.AI_ADMIN)) {
    redirect('/forbidden')
  }

  let newsData = null

  try {
    newsData = await getPostById({ id })
  } catch (error) {
    console.error('Failed to fetch AI use case:', error)
    newsData = null
  }

  if (!newsData) {
    return (
      <InfoLayout
        title="뉴스레터를 찾을 수 없습니다"
        description="요청하신 ID의 뉴스레터가 존재하지 않습니다."
        backLink="/news-letter"
      />
    )
  }

  if (newsData.visibility === 'private') {
    return (
      <InfoLayout
        title="비공개 게시물입니다"
        description="비공개 게시물은 수정할 수 없습니다."
        backLink="/news-letter"
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageBreadcrumb
        items={[
          { label: '뉴스레터', href: '/news-letter' },
          { label: '수정하기' },
        ]}
      />

      <PostForm
        mode="edit"
        postType="news"
        initialData={{
          id: newsData.postId,
          title: newsData.title || '',
          content: newsData.content,
          thumbnailUrl: newsData.thumbnailUrl || '',
          category: newsData.category || '',
          tags: newsData.tags || [],
          openType: newsData.openType || 'page',
          visibility: newsData.visibility || 'private',
          summaryType: newsData.summaryType || 'auto_truncated',
          summary: newsData.summary || '',
        }}
      />
    </div>
  )
}
