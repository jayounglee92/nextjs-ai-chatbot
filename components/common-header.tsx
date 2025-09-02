'use client'

import { SidebarToggle } from '@/components/sidebar-toggle'
import { memo } from 'react'
import { SidebarUserNav } from './sidebar-user-nav'
import { useSession } from 'next-auth/react'

function PureCommonHeader() {
  const { data: session, status } = useSession()

  return (
    <header className="z-20 shadow-sm flex sticky top-0 bg-background items-center justify-between py-2 px-4 gap-2">
      <SidebarToggle />
      <div className="place-items-end">
        {session && <SidebarUserNav user={session.user} />}
      </div>
    </header>
  )
}

export const CommonHeader = memo(PureCommonHeader)
