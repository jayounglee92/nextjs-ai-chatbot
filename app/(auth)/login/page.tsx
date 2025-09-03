'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { toast } from '@/components/toast'

import { AuthForm } from '@/components/auth-form'
import { SubmitButton } from '@/components/submit-button'

import { login, type LoginActionState } from '../actions'
import { useSession } from 'next-auth/react'

export default function Page() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [isSuccessful, setIsSuccessful] = useState(false)

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

  return (
    <div className="flex h-dvh w-screen items-start justify-center bg-background pt-12 md:items-center md:pt-0">
      <div className="flex w-full max-w-md flex-col gap-12 overflow-hidden rounded-2xl">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">로그인</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            이메일과 비밀번호를 입력해주세요.
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>로그인</SubmitButton>
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
