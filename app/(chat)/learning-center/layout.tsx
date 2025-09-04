import { CommonHeader } from '@/components/common-header'

export default function LearningCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CommonHeader />
      <div className="p-3 md:p-8 mb-20">
        <div className="max-w-7xl mx-auto flex flex-1 flex-col">{children}</div>
      </div>
    </>
  )
}
