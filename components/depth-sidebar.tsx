'use client'

import type { User } from 'next-auth'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { SidebarHistory } from '@/components/sidebar-history'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import Link from 'next/link'
import {
  WandSparklesIcon,
  HomeIcon,
  OrbitIcon,
  FlaskConicalIcon,
  NewspaperIcon,
  SchoolIcon,
} from 'lucide-react'
import { PlusIcon } from './icons'
import Image from 'next/image'
import logo from '@/public/images/logo.png'

// 메뉴 타입 정의
type MenuType =
  | 'home'
  | 'space'
  | 'ai-use-case'
  | 'ai-lab'
  | 'news-letter'
  | 'learning-center'
  | null

interface DepthSidebarProps {
  user: User | undefined
}

export function DepthSidebar({ user }: DepthSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { setOpenMobile, open, setOpen, isMobile, openMobile } = useSidebar()
  const [hoveredMenu, setHoveredMenu] = useState<MenuType>(null)
  const [activeMenu, setActiveMenu] = useState<MenuType>('home')

  // 현재 경로에 따라 activeMenu 설정
  useEffect(() => {
    if (pathname === '/') {
      setActiveMenu('home')
    } else if (pathname.startsWith('/ai-use-case')) {
      setActiveMenu('ai-use-case')
    } else if (pathname.startsWith('/space')) {
      setActiveMenu('space')
    } else if (pathname.startsWith('/ai-lab')) {
      setActiveMenu('ai-lab')
    } else if (pathname.startsWith('/news-letter')) {
      setActiveMenu('news-letter')
    } else if (pathname.startsWith('/learning-center')) {
      setActiveMenu('learning-center')
    }
  }, [pathname])

  // 현재 사이드바가 열려있는지 확인 (모바일/데스크톱 상태에 따라)
  const isOpen = isMobile ? openMobile : open

  // 메뉴 아이템 설정
  const menuItems = [
    {
      id: 'home' as const,
      label: '홈',
      icon: HomeIcon,
      hasSubmenu: true,
    },
    // {
    //   id: 'space' as const,
    //   label: '공간',
    //   icon: OrbitIcon,
    //   hasSubmenu: false,
    // },
    // {
    //   id: 'ai-lab' as const,
    //   label: 'AI Lab',
    //   icon: FlaskConicalIcon,
    //   hasSubmenu: false,
    // },
    {
      id: 'ai-use-case' as const,
      label: 'AI 활용 사례',
      icon: WandSparklesIcon,
      hasSubmenu: false,
    },
    {
      id: 'news-letter' as const,
      label: '뉴스레터',
      icon: NewspaperIcon,
      hasSubmenu: false,
    },
    {
      id: 'learning-center' as const,
      label: '학습센터',
      icon: SchoolIcon,
      hasSubmenu: false,
    },
  ]

  const handleMenuClick = (menuId: MenuType) => {
    if (
      menuId === 'ai-use-case' ||
      menuId === 'space' ||
      menuId === 'ai-lab' ||
      menuId === 'news-letter' ||
      menuId === 'learning-center'
    ) {
      setActiveMenu(menuId)
      if (menuId === 'ai-use-case') {
        router.push('/ai-use-case')
      } else if (menuId === 'space') {
        router.push('/space')
      } else if (menuId === 'ai-lab') {
        router.push('/ai-lab')
      } else if (menuId === 'news-letter') {
        router.push('/news-letter')
      } else if (menuId === 'learning-center') {
        router.push('/learning-center')
      }
    } else {
      setActiveMenu(menuId)
      if (menuId === 'home') {
        router.push('/')
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
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeMenu === item.id ? 'secondary' : 'ghost'}
                    size="sm"
                    className="flex flex-col size-16 gap-1 p-0 text-md text-left text-gray-700"
                    onClick={() => handleMenuClick(item.id)}
                    onMouseEnter={() =>
                      item.hasSubmenu && setHoveredMenu(item.id)
                    }
                    onMouseLeave={() => setHoveredMenu(null)}
                  >
                    <item.icon className="!h-6 !w-6 shrink-0" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                ))}
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
