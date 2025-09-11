import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'
import { AuthLayout } from '@/components/auth-layout'

export default function Unauthorized() {
  return (
    <AuthLayout
      title="401"
      subtitle="로그인이 필요합니다"
      description="이 페이지에 접근하려면 먼저 로그인해주세요."
      content={
        <div className="flex justify-center">
          <Button type="button">
            <LogIn className="size-4" />
            로그인 페이지로 이동
          </Button>
        </div>
      }
      underInfo="로그인 오류 또는 기타 문의는 sso-support@idstrust.com로 문의해주세요."
    />
  )
}
