'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';
import { UsersIcon, HomeIcon, OrbitIcon } from 'lucide-react';
import { PlusIcon } from './icons';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';

// 메뉴 타입 정의
type MenuType = 'home' | 'space' | 'community' | null;

interface DepthSidebarProps {
  user: User | undefined;
}

export function DepthSidebar({ user }: DepthSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [hoveredMenu, setHoveredMenu] = useState<MenuType>(null);
  const [activeMenu, setActiveMenu] = useState<MenuType>('home');

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
      hasSubmenu: true,
    },
    {
      id: 'community' as const,
      label: '커뮤니티',
      icon: UsersIcon,
      hasSubmenu: false,
    },
  ];

  const handleMenuClick = (menuId: MenuType) => {
    if (menuId === 'community') {
      setActiveMenu('community');
      router.push('/community');
    } else {
      setActiveMenu(menuId);
      if (menuId === 'home' || menuId === 'space') {
        router.push('/');
      }
    }
    setOpenMobile(false);
  };

  const handleNewChat = () => {
    setOpenMobile(false);
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* 메인 사이드바 */}
      <div
        className="group peer hidden text-sidebar-foreground md:block"
        data-state="expanded"
        data-side="left"
      >
        <div className="relative h-svh w-20 bg-transparent transition-[width] duration-200 ease-linear" />
        <div className="fixed inset-y-0 left-0 z-50 hidden h-svh w-20 border-sidebar-border transition-[left,right,width] duration-200 ease-linear md:flex">
          <div className="relative z-40 flex h-full w-full flex-col bg-sidebar">
            {/* 헤더 */}
            <div className="flex flex-col gap-2 p-2">
              <div className="flex flex-col items-center py-2">
                <Link
                  href="/"
                  onClick={() => {
                    setOpenMobile(false);
                    setActiveMenu('home');
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground"
                >
                  C
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
        {hoveredMenu && (
          <motion.div
            initial={{ x: -63, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -63, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="absolute left-20 top-0 z-10 h-full w-[280px] overflow-hidden border-r border-sidebar-border bg-sidebar shadow-lg"
            onMouseEnter={() => setHoveredMenu(hoveredMenu)}
            onMouseLeave={() => setHoveredMenu(null)}
          >
            <div className="flex h-full w-full flex-col">
              <div className="border-b border-sidebar-border p-4">
                <h3 className="text-sm font-medium text-sidebar-foreground">
                  {hoveredMenu === 'home' ? '개인 채팅' : '공개 채팅'}
                </h3>
              </div>

              <div className="flex-1 overflow-hidden">
                {hoveredMenu === 'home' && (
                  <SidebarHistory user={user} visibilityFilter="private" />
                )}
                {hoveredMenu === 'space' && (
                  <SidebarHistory user={user} visibilityFilter="public" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
