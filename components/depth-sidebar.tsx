'use client'

import type { User } from 'next-auth'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { SidebarHistory } from '@/components/sidebar-history'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import Link from 'next/link'
import { PlusIcon } from './icons'
import Image from 'next/image'
import logo from '@/public/images/logo.png'
import { routeConfig, type RouteItem } from '@/app/(auth)/auth.route.config'

interface DepthSidebarProps {
  user: User | undefined
}

export function DepthSidebar({ user }: DepthSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { setOpenMobile, open, setOpen, isMobile, openMobile } = useSidebar()
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null)
  const [activeMenu, setActiveMenu] = useState<string>('home')

  // 현재 경로에 따라 activeMenu 설정
  useEffect(() => {
    const currentRoute = routeConfig.find((route) => {
      if (route.url === pathname) return true
      if (route.children) {
        return route.children.some(
          (child) =>
            child.url && pathname.startsWith(child.url.replace(/\[.*?\]/g, '')),
        )
      }
      return false
    })

    if (currentRoute) {
      setActiveMenu(currentRoute.id)
    }
  }, [pathname])

  // 현재 사이드바가 열려있는지 확인 (모바일/데스크톱 상태에 따라)
  const isOpen = isMobile ? openMobile : open

  // 사이드바에 표시할 메뉴 아이템들 (children이 있는 그룹만)
  const sidebarMenuItems = routeConfig.filter((route) => route.type === 'group')

  const handleMenuClick = (route: RouteItem) => {
    setActiveMenu(route.id)

    // URL이 있는 경우 해당 URL로 이동
    if (route.url) {
      router.push(route.url)
    } else if (route.children && route.children.length > 0) {
      // children이 있는 경우 첫 번째 child의 URL로 이동
      const firstChild = route.children.find((child) => child.url)
      if (firstChild?.url) {
        router.push(firstChild.url)
      }
    }

    // 모바일에서만 사이드바 닫기
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleNewChat = () => {
    // 모바일에서만 사이드바 닫기
    if (isMobile) {
      setOpenMobile(false)
    }
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* 메인 사이드바 */}
      <div
        className={`group peer text-sidebar-foreground transition-all duration-200 ease-linear ${
          isOpen ? 'block' : 'hidden'
        }`}
        data-state={isOpen ? 'expanded' : 'collapsed'}
        data-side="left"
      >
        <div
          className={`relative h-svh bg-transparent transition-[width] duration-200 ease-linear ${
            isOpen ? 'w-20' : 'w-0'
          }`}
        />
        <div
          className={`fixed inset-y-0 left-0 z-50 h-svh transition-[left,right,width] duration-200 ease-linear ${
            isOpen ? 'w-20 flex border-sidebar-border' : 'w-0 hidden'
          }`}
        >
          <div className="relative z-40 flex size-full flex-col bg-sidebar">
            {/* 헤더 */}
            <div className="flex flex-col gap-2 p-2">
              <div className="flex flex-col items-center py-2">
                <Link
                  href="/"
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false)
                    }
                    setActiveMenu('home')
                  }}
                  className="flex size-14 items-center justify-center rounded-lg  text-lg font-bold text-primary-foreground hover:bg-secondary hover:text-primary-foreground"
                >
                  <Image
                    src={logo}
                    alt="logo"
                    width={24}
                    height={24}
                    className="size-6"
                  />
                </Link>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
              <div className="flex flex-col gap-2 px-2 items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full flex flex-col size-12 gap-1 p-0 text-md text-left text-gray-700"
                  onClick={() => {
                    // 홈페이지로 이동하여 새 채팅 시작
                    router.push('/')
                    router.refresh() // 페이지 새로고침으로 상태 초기화
                  }}
                >
                  <PlusIcon />
                </Button>
                {sidebarMenuItems.map((route) => {
                  const IconComponent = route.icon
                  return (
                    <Button
                      key={route.id}
                      variant={activeMenu === route.id ? 'secondary' : 'ghost'}
                      size="sm"
                      className="flex flex-col size-16 gap-1 p-0 text-md text-left text-gray-700"
                      onClick={() => handleMenuClick(route)}
                      onMouseEnter={() =>
                        route.hasSubMenu && setHoveredMenu(route.id)
                      }
                      onMouseLeave={() => setHoveredMenu(null)}
                    >
                      {IconComponent && (
                        <IconComponent className="!h-6 !w-6 shrink-0" />
                      )}
                      <span className="text-xs">{route.title}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 서브메뉴 사이드바 - Floating Overlay */}
      <AnimatePresence>
        {hoveredMenu && isOpen && (
          <motion.div
            initial={{ x: -63, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -63, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed left-20 top-0 z-30 h-full w-[280px] overflow-hidden border-sidebar-border bg-sidebar shadow-lg"
            onMouseEnter={() => setHoveredMenu(hoveredMenu)}
            onMouseLeave={(e) => {
              // 마우스가 서브메뉴 영역을 벗어났는지 확인
              const relatedTarget = e.relatedTarget as HTMLElement

              // html 요소로 이동한 경우 (드롭다운 메뉴 클릭 시 발생) 닫지 않음
              if (relatedTarget?.tagName === 'HTML') {
                return
              }

              setHoveredMenu(null)
            }}
          >
            <div className="flex h-full size-full flex-col">
              <div className="border-b border-sidebar-border p-4">
                <h3 className="text-sm font-medium text-sidebar-foreground">
                  모든 채팅
                </h3>
              </div>

              <div className="flex-1 overflow-hidden">
                {hoveredMenu === 'home' && (
                  <SidebarHistory user={user} visibilityFilter="all" />
                )}
                {hoveredMenu && hoveredMenu !== 'home' && (
                  <div className="p-4">
                    <div className="space-y-2">
                      {routeConfig
                        .find((route) => route.id === hoveredMenu)
                        ?.children?.filter(
                          (child) => child.url && !child.url.includes('['),
                        )
                        .map((child) => (
                          <Link
                            key={child.id}
                            href={child.url!}
                            className="block px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
                            onClick={() => {
                              if (isMobile) {
                                setOpenMobile(false)
                              }
                              setHoveredMenu(null)
                            }}
                          >
                            {child.title}
                          </Link>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
