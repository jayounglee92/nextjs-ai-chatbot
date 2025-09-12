import type { ReactNode } from 'react'

interface ErrorLayoutProps {
  title: string
  subtitle?: string
  description?: string
  content: ReactNode
}

export function ErrorLayout({
  title,
  subtitle,
  description,
  content,
}: ErrorLayoutProps) {
  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-white p-4">
      <div className="flex items-center gap-4 -ml-48">
        <h1 className="text-4xl  text-black">{title}</h1>
        <div className="text-left text-sm border-l pl-4">
          {subtitle && <h2 className="font-semibold text-lg">{subtitle}</h2>}
          {description && <p>{description}</p>}
          {content && <div>{content}</div>}
        </div>
      </div>
    </div>
  )
}
