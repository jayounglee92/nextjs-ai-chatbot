import { PencilLineIcon } from 'lucide-react'
import Link from 'next/link'

export function WriteButton({
  href,
  text,
}: {
  href: string
  text: string
}) {
  return (
    <Link
      href={href}
      className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center justify-center gap-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 md:static md:rounded-lg md:h-10 md:w-auto md:px-4"
    >
      <PencilLineIcon className="size-4" />
      <span className="hidden md:block">{text}</span>
    </Link>
  )
}

export function LayoutHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="space-y-4 flex flex-col mb-8">
      <div className="flex items-center gap-2 justify-between">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {actions}
      </div>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  )
}
export const LayoutHeaderWriteButton = WriteButton
