'use client'

import { SidebarToggle } from '@/components/sidebar-toggle'
import { memo } from 'react'
import { SidebarUserNav } from './sidebar-user-nav'
import { useSession } from 'next-auth/react'

function PureCommonHeader() {
  const { data: session, status } = useSession()

  return (
    <header className="z-10 shadow-sm flex sticky top-0 bg-background items-center p-2 gap-2">
      <SidebarToggle />
      <div className="ml-auto">
        {session && <SidebarUserNav user={session.user} />}
      </div>
    </header>
  )
}

export const CommonHeader = memo(PureCommonHeader)
