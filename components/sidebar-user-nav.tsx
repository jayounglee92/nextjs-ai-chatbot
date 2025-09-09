'use client'

import React from 'react'
import type { User } from 'next-auth'
import { signOut, useSession } from 'next-auth/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useRouter } from 'next/navigation'
import { toast } from './toast'
import { LoaderIcon } from './icons'
import { LogInIcon, LogOutIcon } from 'lucide-react'

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter()
  const { data, status } = useSession()

  // 클라이언트 사이드에서 세션 정보 로그 출력
  React.useEffect(() => {
    if (data) {
      console.log('🎯 클라이언트 사이드 세션 정보:', {
        status,
        user: {
          id: data.user?.id,
          name: data.user?.name,
          email: data.user?.email,
          type: data.user?.type,
        },
        expires: data.expires,
      })
    }
  }, [data, status])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {status === 'loading' ? (
              <SidebarMenuButton className="h-10 justify-between data-[state=open]:text-sidebar-accent-foreground !hover:bg-none">
                <div className="flex flex-row gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
                  <span className="animate-pulse rounded-md bg-zinc-500/30 text-transparent">
                    Loading auth status
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                data-testid="user-nav-button"
                className="h-10 data-[state=open]:text-sidebar-accent-foreground hover:bg-none! "
              >
                <div className="bg-muted rounded-full size-8 flex items-center justify-center font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <span data-testid="user-email" className="truncate">
                  {user?.email}
                </span>
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            {/* <DropdownMenuItem
              data-testid="user-nav-item-theme"
              className="cursor-pointer"
              onSelect={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
            >
              {`${resolvedTheme === 'light' ? '다크' : '라이트'} 모드로 변경`}
            </DropdownMenuItem>
            <DropdownMenuSeparator /> */}
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  if (status === 'loading') {
                    toast({
                      type: 'error',
                      description:
                        '인증 상태를 확인하는 중입니다. 다시 시도해주세요!',
                    })

                    return
                  }

                  if (status === 'unauthenticated') {
                    router.push('/login')
                  } else {
                    signOut({
                      redirectTo: '/',
                    })
                  }
                }}
              >
                {status === 'unauthenticated' ? (
                  <>
                    <LogInIcon />
                    로그인
                  </>
                ) : (
                  <>
                    <LogOutIcon />
                    로그아웃
                  </>
                )}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
