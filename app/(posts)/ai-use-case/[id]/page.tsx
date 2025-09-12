import { auth } from '@/app/(auth)/auth'
import { redirect } from 'next/navigation'
import { getPostById } from '@/lib/db/queries'
import type { Metadata, ResolvingMetadata } from 'next'
import { generatePostMetadata } from '@/lib/metadata-utils'
import { InfoLayout } from '@/components/info-layout'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { PostMetaInfo } from '@/components/post-meta-info'
import { AiUseCaseActions } from './ai-use-case-actions'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params
  return generatePostMetadata({ id, parent, pageType: 'ai-use-case' })
}

export default async function Page({ params }: Props) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const { id } = await params
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
    return <InfoLayout title="비공개 게시물입니다" backLink="/ai-use-case" />
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
