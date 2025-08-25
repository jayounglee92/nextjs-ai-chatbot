'use client';

import { SidebarToggle } from '@/components/sidebar-toggle';
import { memo } from 'react';

function PureSpaceHeader() {
  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      {/* 사이드바 열기/닫기 토글 버튼 */}
      <SidebarToggle />
    </header>
  );
}

export const SpaceHeader = memo(PureSpaceHeader);
