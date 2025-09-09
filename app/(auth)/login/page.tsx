'use client'

import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogInIcon } from 'lucide-react'
import Image from 'next/image'

export default function Page() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleKeycloakLogin = () => {
    signIn('keycloak', {
      callbackUrl: callbackUrl,
      redirect: true,
    })
  }

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <div className="flex w-full max-w-md flex-col gap-8 overflow-hidden rounded-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            로그인
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
            사내 통합 계정으로 로그인 해주세요
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 md:p-8 shadow-xl dark:bg-slate-800 space-y-8">
          <Button
            type="button"
            onClick={handleKeycloakLogin}
            className="group  relative h-12 max-h-14 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transition-all duration-200 hover:from-amber-600 hover:to-orange-600 hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-3 text-base font-semibold">
              <LogInIcon />
              사내 통합 계정으로 계속하기
            </div>
          </Button>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            로그인 오류 또는 기타 문의는 sso-support@idstrust.com로 문의해
            주세요.
          </p>
        </div>
        <div className="flex justify-center">
          <Image
            src={'images/logo-text.png'}
            alt="logo"
            width={100}
            height={100}
          />
        </div>
      </div>
    </div>
  )
}
