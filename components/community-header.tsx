'use client';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

function PureCommunityHeader() {
  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center justify-between px-2 md:pl-2 md:pr-4 gap-2">
      {/* 사이드바 열기/닫기 토글 버튼 */}
      <SidebarToggle />

      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/community/write"
            className="border rounded-md p-1 hover:bg-muted"
          >
            <PlusIcon />
          </Link>
        </TooltipTrigger>
        <TooltipContent align="end">글쓰기</TooltipContent>
      </Tooltip>
    </header>
  );
}

export const CommunityHeader = memo(PureCommunityHeader);
