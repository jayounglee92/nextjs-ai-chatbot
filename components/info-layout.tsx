import Link from 'next/link'

interface InfoLayoutProps {
  title: string
  description?: string
  backLink: string
  backLinkText?: string
  icon?: React.ReactNode
}

export function InfoLayout({
  title,
  description,
  backLink,
  backLinkText = '목록으로',
  icon,
}: InfoLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
      <div className="text-center space-y-4">
        {icon && <div className="mb-4 flex justify-center">{icon}</div>}
        <h1 className="text-xl font-semibold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Link
          href={backLink}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {backLinkText}
        </Link>
      </div>
    </div>
  )
}
