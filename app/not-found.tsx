import Link from 'next/link'
import { ArrowLeft, HomeIcon } from 'lucide-react'
import { ErrorLayout } from '@/components/error-layout'

export default function NotFound() {
  return (
    <ErrorLayout
      title="404"
      subtitle="페이지를 찾을 수 없습니다"
      content={
        <div className="flex gap-6 pt-4">
          <Link
            href="/"
            className="flex items-center gap-2 underline underline-offset-4 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="size-4" />
            이전 페이지로 돌아가기
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 underline underline-offset-4 hover:text-amber-600 transition-colors"
          >
            <HomeIcon className="size-4" />
            홈으로
          </Link>
        </div>
      }
    />
  )
}
