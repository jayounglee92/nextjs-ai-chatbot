import { CommunityHeader } from '@/components/community-header';

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CommunityHeader />
      <main>{children}</main>
    </>
  );
}
