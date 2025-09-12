import type { ReactNode } from 'react'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  description?: string
  content: ReactNode
}

export function AuthLayout({
  title,
  subtitle,
  description,
  content,
}: AuthLayoutProps) {
  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-white p-4">
      <div className="flex items-center gap-4 -ml-48">
        <h1 className="text-4xl  text-black">{title}</h1>
        <div className="w-px h-24 bg-gray-300" />
        <div className="text-left text-sm">
          {subtitle && <h2>{subtitle}</h2>}
          {description && <p>{description}</p>}
          {content && <div>{content}</div>}
        </div>
      </div>
    </div>
  )
}
