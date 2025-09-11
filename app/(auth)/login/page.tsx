'use client'

import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogInIcon } from 'lucide-react'
import { Suspense } from 'react'
import { AuthLayout } from '@/components/auth-layout'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleKeycloakLogin = () => {
    signIn('keycloak', {
      callbackUrl: callbackUrl,
      redirect: true,
    })
  }

  return (
    <AuthLayout
      title="로그인"
      description="사내 통합 계정으로 로그인 해주세요"
      content={
        <Button
          type="button"
          onClick={handleKeycloakLogin}
          className="group relative h-12 max-h-14 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white transition-all duration-200 hover:from-amber-600 hover:to-orange-600 hover:shadow-xl"
        >
          <div className="flex items-center justify-center gap-3 text-base font-semibold">
            <LogInIcon />
            사내 통합 계정으로 계속하기
          </div>
        </Button>
      }
      underInfo="로그인 오류 또는 기타 문의는 sso-support@idstrust.com로 문의해주세요."
    />
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
