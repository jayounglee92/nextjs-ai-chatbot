import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BackButton } from '@/components/back-button'
import { HomeIcon } from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'

export default function Forbidden() {
  return (
    <AuthLayout
      title="403"
      subtitle="접근 권한이 없습니다"
      description="해당 페이지에 접근하려면 관리자 권한이 필요합니다."
      content={
        <div className="grid grid-cols-2 gap-4">
          <BackButton />
          <Button type="button" asChild>
            <div className="flex items-center justify-center gap-3">
              <HomeIcon />
              <Link href="/">홈으로</Link>
            </div>
          </Button>
        </div>
      }
      underInfo="로그인 오류 또는 기타 문의는 sso-support@idstrust.com로 문의해주세요."
    />
  )
}
