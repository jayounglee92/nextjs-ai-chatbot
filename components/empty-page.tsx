export const EmptyPage = ({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: React.ReactNode
}) => {
  return (
    <div className="flex h-[calc(100vh-20rem)] items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground mb-4">{description}</p>
        {actions}
      </div>
    </div>
  )
}
