'use client'

import { useEffect } from 'react'
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
import { redirect, useRouter } from 'next/navigation'
import { toast } from './toast'
import { LoaderIcon } from './icons'
import { LogInIcon, LogOutIcon } from 'lucide-react'

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter()
  const { data, status } = useSession()

  // 클라이언트 사이드에서 세션 정보 로그 출력
  useEffect(() => {
    if (data) {
      console.log('🎯 클라이언트 사이드 세션 정보:', data)
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
                <div className="size-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold text-lg">
                  {user?.id?.charAt(0).toUpperCase()}
                </div>
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-fit p-0"
            align="end"
          >
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold text-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {user?.id || '사용자'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || '이메일 없음'}
                  </div>
                </div>
              </div>
            </div>
            <div className="py-1">
              <DropdownMenuItem asChild data-testid="user-nav-item-auth">
                <button
                  type="button"
                  className="w-full cursor-pointer flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
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
                      redirect('/login')
                    } else {
                      signOut({
                        redirectTo: '/',
                      })
                    }
                  }}
                >
                  {status === 'unauthenticated' ? (
                    <>
                      <LogInIcon className="size-4" />
                      로그인
                    </>
                  ) : (
                    <>
                      <LogOutIcon className="size-4" />
                      로그아웃
                    </>
                  )}
                </button>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
