import Image from 'next/image'
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  description?: string
  content: ReactNode
  underInfo?: string
}

export function AuthLayout({
  title,
  subtitle,
  description,
  content,
  underInfo,
}: AuthLayoutProps) {
  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-900 dark:to-slate-800">
      <div className="flex w-full max-w-md flex-col gap-8 overflow-hidden rounded-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {subtitle && (
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mt-2">
              {subtitle}
            </h2>
          )}
          {description && (
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
              {description}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 md:p-8 dark:bg-slate-800 space-y-8">
          {content}
          {underInfo && (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              {underInfo}
            </p>
          )}
        </div>
        <div className="flex justify-center">
          <Image
            src={'/images/logo-text.png'}
            alt="logo"
            width={120}
            height={24}
          />
        </div>
      </div>
    </div>
  )
}
