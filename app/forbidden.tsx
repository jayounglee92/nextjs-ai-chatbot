import Link from 'next/link'
import { ArrowLeft, HomeIcon } from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'

export default function Forbidden() {
  return (
    <AuthLayout
      title="403"
      subtitle="접근 권한이 없습니다"
      description="해당 페이지에 접근하려면 관리자 권한이 필요합니다."
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
