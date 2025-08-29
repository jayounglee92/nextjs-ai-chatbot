import { CommunityHeader } from '@/components/community-header'

export default function NewsLetterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CommunityHeader />
      <main>{children}</main>
    </>
  )
}
