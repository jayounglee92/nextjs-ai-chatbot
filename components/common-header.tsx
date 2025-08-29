'use client'

import { SidebarToggle } from '@/components/sidebar-toggle'
import { memo } from 'react'
import { SidebarUserNav } from './sidebar-user-nav'
import { useSession } from 'next-auth/react'

function PureCommonHeader() {
  const { data: session, status } = useSession()

  return (
    <header className="z-10 shadow-sm flex sticky top-0 bg-background items-center justify-between px-3 md:pl-2 md:pr-4 gap-2 bg-white">
      {/* 사이드바 열기/닫기 토글 버튼 */}
      <SidebarToggle />
      <div className="flex flex-col gap-2 p-2 h-14">
        {session && <SidebarUserNav user={session.user} />}
      </div>
    </header>
  )
}

export const CommonHeader = memo(PureCommonHeader)
