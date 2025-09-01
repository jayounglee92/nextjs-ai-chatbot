export const LoadingPage = () => {
  return (
    <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
      <div className="text-center">
        <div className="flex space-x-1 justify-center mb-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s] [animation-duration:0.8s] [animation-timing-function:cubic-bezier(0.68,-0.55,0.265,1.55)]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s] [animation-duration:0.8s] [animation-timing-function:cubic-bezier(0.68,-0.55,0.265,1.55)]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-timing-function:cubic-bezier(0.68,-0.55,0.265,1.55)]" />
        </div>
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    </div>
  )
}
