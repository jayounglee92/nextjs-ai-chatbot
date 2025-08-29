import { CommonHeader } from '@/components/common-header'

export default function LearningCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CommonHeader />
      <main className="p-3 md:p-8">{children}</main>
    </>
  )
}
