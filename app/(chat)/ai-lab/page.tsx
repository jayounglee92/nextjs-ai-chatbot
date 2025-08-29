import { FlaskConicalIcon } from 'lucide-react'

export default function AiLabPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 h-[calc(100vh-4rem)]">
      <div className="max-w-md space-y-4 text-center flex flex-col items-center">
        <div className="flex flex-col items-center gap-2">
          <FlaskConicalIcon className="mb-4 !size-10 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">AI Lab</h1>
        </div>
        <p className="text-muted-foreground">
          AI Lab 기능은 곧 출시될 예정입니다.
        </p>
        <div className="text-sm text-muted-foreground/70">
          다양한 기능을 체험해보세요.
        </div>
      </div>
    </div>
  )
}
