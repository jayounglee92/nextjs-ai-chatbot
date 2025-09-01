import { auth } from '@/app/(auth)/auth'
import { redirect } from 'next/navigation'
import { User, Clock } from 'lucide-react'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { calculateReadingTime, getRelativeTimeString } from '@/lib/utils'
import { getAiUseCaseById } from '@/lib/db/queries'
import type { AiUseCase } from '@/lib/db/schema'
import Link from 'next/link'
import { AiUseCaseActions } from './ai-use-case-actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AiUseCaseDetailPage({ params }: Props) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const { id } = await params
  let useCase: AiUseCase | null = null

  try {
    useCase = await getAiUseCaseById({ id })
  } catch (error) {
    console.error('Failed to fetch AI use case:', error)
    useCase = null
  }

  if (!useCase) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            AI 활용 사례를 찾을 수 없습니다
          </h2>
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
    <div className="max-w-6xl mx-auto py-6">
      <div className="grid grid-cols-1">
        {/* 제목 */}
        <div>
          <Link href="/ai-use-case" className="text-gray-500">
            AI 활용 사례
          </Link>
          <h1 className="text-4xl font-bold text-foreground my-6">
            {useCase.title}
          </h1>

          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-4">
            <span className="flex gap-2 items-center">
              <User className="h-5 w-5 border rounded-full" />
              {useCase.userId}
            </span>
            <span className="text-gray-300 font-bold">|</span>
            <span className="flex gap-2 items-center">
              <Clock className="h-5 w-5" />
              {calculateReadingTime(useCase.content)}
            </span>
            <span className="text-gray-300 font-bold">|</span>
            <span>{getRelativeTimeString(useCase.createdAt)}</span>
            <div className="flex gap-6 ml-auto">
              <AiUseCaseActions useCase={useCase} />
            </div>
          </div>
        </div>
        <hr className="my-10 border-t-2 border-primary" />
        <SimpleEditor viewMode={true} initialContent={useCase.content} />
      </div>
    </div>
  )
}
