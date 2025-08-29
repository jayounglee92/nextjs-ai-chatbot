import { CommonHeader } from '@/components/common-header'

export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CommonHeader />
      <main>{children}</main>
    </>
  )
}
