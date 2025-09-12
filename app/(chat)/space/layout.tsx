import { CommonHeader } from '@/components/common-header'

export default function Layout({
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
