'use client';

import { OrbitIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SpacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <div />;
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 flex flex-col items-center">
        <OrbitIcon className="mb-4 !size-16" />
        <h1 className="text-2xl font-semibold text-foreground">공간</h1>
        <p className="text-muted-foreground max-w-md">
          팀 단위의 공개된 채팅 공간입니다. 팀원들과 함께 대화를 나누고
          아이디어를 공유해보세요.
        </p>
      </div>
    </div>
  );
}
