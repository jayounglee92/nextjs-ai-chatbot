'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { toast } from '@/components/toast'
import { signIn } from 'next-auth/react'

import { AuthForm } from '@/components/auth-form'
import { SubmitButton } from '@/components/submit-button'

import { login, type LoginActionState } from '../actions'
import { useSession } from 'next-auth/react'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [isSuccessful, setIsSuccessful] = useState(false)

  // callbackUrl 파라미터 가져오기
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  )

  const { update: updateSession } = useSession()

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: '잘못된 이메일 또는 비밀번호입니다.',
      })
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: '입력 값이 유효하지 않습니다.',
      })
    } else if (state.status === 'success') {
      setIsSuccessful(true)
      updateSession()
      router.refresh()
    }
  }, [state.status, updateSession, router])

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string)
    formAction(formData)
  }

  // Keycloak 로그인 핸들러
  const handleKeycloakLogin = () => {
    console.log('🔐 Keycloak 로그인 시작')
    console.log('🔄 콜백 URL:', callbackUrl)

    signIn('keycloak', {
      callbackUrl: callbackUrl,
      redirect: true,
    })
  }

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">로그인</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            사내 계정으로 로그인하거나 이메일과 비밀번호를 입력해주세요.
          </p>
        </div>

        {/* Keycloak 로그인 버튼 */}
        <div className="px-4 sm:px-16">
          <button
            type="button"
            onClick={handleKeycloakLogin}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            🏢 사내 계정으로 로그인 (Keycloak)
          </button>
        </div>

        {/* 구분선 */}
        <div className="px-4 sm:px-16">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-2 text-gray-500 dark:text-gray-400">
                또는
              </span>
            </div>
          </div>
        </div>

        {/* 기존 이메일/비밀번호 로그인 폼 */}
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>
            이메일로 로그인
          </SubmitButton>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-zinc-400">
            {'계정이 없으신가요? '}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              회원가입하러 가기
            </Link>
          </p>
        </AuthForm>
      </div>
    </div>
  )
}
