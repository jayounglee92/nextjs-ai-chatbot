'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowSize } from 'usehooks-ts';

import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import { UsersIcon, HomeIcon, OrbitIcon } from 'lucide-react';
import { PlusIcon } from './icons';
import Image from 'next/image';
import logo from '@/public/images/logo.png';

// 메뉴 타입 정의
type MenuType = 'home' | 'space' | 'community' | null;

interface DepthSidebarProps {
  user: User | undefined;
}

export function DepthSidebar({ user }: DepthSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile, open, setOpen, isMobile, openMobile } = useSidebar();
  const [hoveredMenu, setHoveredMenu] = useState<MenuType>(null);
  const [activeMenu, setActiveMenu] = useState<MenuType>('home');

  // 현재 사이드바가 열려있는지 확인 (모바일/데스크톱 상태에 따라)
  const isOpen = isMobile ? openMobile : open;

  // 메뉴 아이템 설정
  const menuItems = [
    {
      id: 'home' as const,
      label: '홈',
      icon: HomeIcon,
      hasSubmenu: true,
    },
    {
      id: 'space' as const,
      label: '공간',
      icon: OrbitIcon,
      hasSubmenu: false,
    },
    {
      id: 'community' as const,
      label: '커뮤니티',
      icon: UsersIcon,
      hasSubmenu: false,
    },
  ];

  const handleMenuClick = (menuId: MenuType) => {
    if (menuId === 'community' || menuId === 'space') {
      setActiveMenu(menuId);
      if (menuId === 'community') {
        router.push('/community');
      } else if (menuId === 'space') {
        router.push('/space');
      }
    } else {
      setActiveMenu(menuId);
      if (menuId === 'home') {
        router.push('/');
      }
    }
    // 모바일에서만 사이드바 닫기
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleNewChat = () => {
    // 모바일에서만 사이드바 닫기
    if (isMobile) {
      setOpenMobile(false);
    }
    router.push('/');
    router.refresh();
  };

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
          <div className="relative z-40 flex h-full w-full flex-col bg-sidebar">
            {/* 헤더 */}
            <div className="flex flex-col gap-2 p-2">
              <div className="flex flex-col items-center py-2">
                <Link
                  href="/"
                  onClick={() => {
                    if (isMobile) {
                      setOpenMobile(false);
                    }
                    setActiveMenu('home');
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-lg  text-lg font-bold text-primary-foreground hover:bg-secondary hover:text-primary-foreground"
                >
                  <Image
                    src={logo}
                    alt="logo"
                    width={24}
                    height={24}
                    className="w-6 h-6"
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
                  className="rounded-full flex flex-col h-12 w-12 gap-1 p-0 text-md text-left text-gray-700"
                  onClick={() => {
                    // 홈페이지로 이동하여 새 채팅 시작
                    router.push('/');
                    router.refresh(); // 페이지 새로고침으로 상태 초기화
                  }}
                >
                  <PlusIcon />
                </Button>
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeMenu === item.id ? 'secondary' : 'ghost'}
                    size="sm"
                    className="flex flex-col h-16 w-16 gap-1 p-0 text-md text-left text-gray-700"
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

            {/* 푸터 */}
            <div className="flex flex-col gap-2 p-2">
              {user && <SidebarUserNav user={user} />}
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
            className="absolute left-20 top-0 z-10 h-full w-[280px] overflow-hidden border-sidebar-border bg-sidebar shadow-lg"
            onMouseEnter={() => setHoveredMenu(hoveredMenu)}
            onMouseLeave={(e) => {
              // 마우스가 서브메뉴 영역을 벗어났는지 확인
              const relatedTarget = e.relatedTarget as HTMLElement;

              // html 요소로 이동한 경우 (드롭다운 메뉴 클릭 시 발생) 닫지 않음
              if (relatedTarget?.tagName === 'HTML') {
                return;
              }

              setHoveredMenu(null);
            }}
          >
            <div className="flex h-full w-full flex-col">
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
  );
}
