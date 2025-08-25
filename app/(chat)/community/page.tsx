'use client';

import { UsersIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PublicChatList } from '@/components/public-chat-list';
import type { Chat } from '@/lib/db/schema';
import { CommunityHeader } from '@/components/community-header';

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [publicChats, setPublicChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    // 공개 채팅 데이터 가져오기
    const fetchPublicChats = async () => {
      try {
        const response = await fetch('/api/history');
        if (response.ok) {
          const data = await response.json();
          // 공개 채팅만 필터링
          const publicChats = data.chats.filter(
            (chat: Chat) => chat.visibility === 'public',
          );
          setPublicChats(publicChats);
        }
      } catch (error) {
        console.error('공개 채팅을 가져오는데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicChats();
  }, [session, status, router]);

  if (status === 'loading' || isLoading) {
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
    <div className="flex flex-1 flex-col  p-8">
      <div className="space-y-4  flex flex-col">
        <div className="flex items-center gap-2">
          <UsersIcon className=" !size-8" />
          <h1 className="text-2xl font-semibold text-foreground">커뮤니티</h1>
        </div>
        <p className="text-muted-foreground">
          다른 사용자들과 함께 대화하고 지식을 공유할 수 있는 공간입니다.
        </p>
      </div>
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">공개 채팅 목록</h2>
          <PublicChatList chats={publicChats} />
        </div>
      </div>
    </div>
  );
}
