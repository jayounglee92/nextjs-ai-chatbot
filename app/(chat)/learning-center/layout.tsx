import { CommunityHeader } from '@/components/community-header'

export default function LearningCenterLayout({
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
