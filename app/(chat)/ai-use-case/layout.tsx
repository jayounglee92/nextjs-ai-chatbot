import { CommonHeader } from '@/components/common-header'

export default function AiUseCaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CommonHeader />
      <div className="p-3 md:p-8 mb-20">{children}</div>
    </>
  )
}
