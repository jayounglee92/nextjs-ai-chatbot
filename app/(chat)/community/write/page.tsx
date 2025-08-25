'use client';

import { UsersIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PublicChatList } from '@/components/public-chat-list';
import type { Chat } from '@/lib/db/schema';
import Tiptap from '@/components/tiptap';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';

export default function CommunityPage() {
  const { data: session, status } = useSession();

  if (!session) {
    return <div />;
  }

  return (
    <div className="border rounded-sm w-full max-w-3xl mx-auto">
      <SimpleEditor />
    </div>
  );
}
