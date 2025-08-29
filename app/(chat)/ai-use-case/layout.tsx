import { CommunityHeader } from '@/components/community-header'

export default function AiUseCaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CommunityHeader />
      <main className="p-8">{children}</main>
    </>
  )
}
