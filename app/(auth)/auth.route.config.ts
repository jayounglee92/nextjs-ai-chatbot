import { USER_TYPES, type UserTypes } from '@/app/(auth)/auth'
import {
  WandSparklesIcon,
  HomeIcon,
  NewspaperIcon,
  SchoolIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'

/**
 * 네비게이션 설정 타입 정의
 */
export interface RouteItem {
  id: string
  title: string
  type: 'group' | 'item'
  icon?: ComponentType<{ className?: string }>
  url?: string
  auth?: UserTypes[] // 접근 가능한 사용자 타입들
  children?: RouteItem[]
  hasSubMenu?: boolean
}

/**
 * 네비게이션 설정
 * 각 메뉴 항목별로 접근 가능한 사용자 타입을 정의
 */
export const routeConfig: RouteItem[] = [
  {
    id: 'home',
    title: '홈',
    type: 'group',
    icon: HomeIcon,
    url: '/',
    auth: [USER_TYPES.GENERAL, USER_TYPES.AI_ADMIN],
    hasSubMenu: true,
  },
  {
    id: 'ai-use-case',
    title: 'AI 사용 사례',
    type: 'group',
    icon: WandSparklesIcon,
    auth: [USER_TYPES.GENERAL, USER_TYPES.AI_ADMIN],
    children: [
      {
        id: 'ai-use-case-list',
        title: '사용 사례 목록',
        type: 'item',
        url: '/ai-use-case',
        auth: [USER_TYPES.GENERAL, USER_TYPES.AI_ADMIN],
      },
      {
        id: 'ai-use-case-detail',
        title: '사용 사례 상세',
        type: 'item',
        url: '/ai-use-case/[id]',
        auth: [USER_TYPES.GENERAL, USER_TYPES.AI_ADMIN],
      },
      {
        id: 'ai-use-case-write',
        title: '사용 사례 작성',
        type: 'item',
        url: '/ai-use-case/write',
        auth: [USER_TYPES.AI_ADMIN], // 관리자만 작성 가능
      },
      {
        id: 'ai-use-case-edit',
        title: '사용 사례 수정',
        type: 'item',
        url: '/ai-use-case/[id]/edit',
        auth: [USER_TYPES.AI_ADMIN], // 관리자만 수정 가능
      },
    ],
  },
  {
    id: 'news-letter',
    title: '뉴스레터',
    type: 'group',
    icon: NewspaperIcon,
    auth: [USER_TYPES.GENERAL, USER_TYPES.AI_ADMIN],
    children: [
      {
        id: 'news-letter-list',
        title: '뉴스레터 목록',
        type: 'item',
        url: '/news-letter',
        auth: [USER_TYPES.GENERAL, USER_TYPES.AI_ADMIN],
      },
      {
        id: 'news-letter-detail',
        title: '뉴스레터 상세',
        type: 'item',
        url: '/news-letter/[id]',
        auth: [USER_TYPES.GENERAL, USER_TYPES.AI_ADMIN],
      },
      {
        id: 'news-letter-write',
        title: '뉴스레터 작성',
        type: 'item',
        url: '/news-letter/write',
        auth: [USER_TYPES.AI_ADMIN], // 관리자만 작성 가능
      },
      {
        id: 'news-letter-edit',
        title: '뉴스레터 수정',
        type: 'item',
        url: '/news-letter/[id]/edit',
        auth: [USER_TYPES.AI_ADMIN], // 관리자만 수정 가능
      },
    ],
  },
  {
    id: 'learning-center',
    title: '학습 센터',
    type: 'group',
    icon: SchoolIcon,
    auth: [USER_TYPES.GENERAL, USER_TYPES.AI_ADMIN],
    children: [
      {
        id: 'learning-center-list',
        title: '학습 자료 목록',
        type: 'item',
        url: '/learning-center',
        auth: [USER_TYPES.GENERAL, USER_TYPES.AI_ADMIN],
      },
      {
        id: 'learning-center-detail',
        title: '학습 자료 상세',
        type: 'item',
        url: '/learning-center/[id]',
        auth: [USER_TYPES.GENERAL, USER_TYPES.AI_ADMIN],
      },
      {
        id: 'learning-center-write',
        title: '학습 자료 작성',
        type: 'item',
        url: '/learning-center/write',
        auth: [USER_TYPES.AI_ADMIN], // 관리자만 작성 가능
      },
      {
        id: 'learning-center-edit',
        title: '학습 자료 수정',
        type: 'item',
        url: '/learning-center/[id]/edit',
        auth: [USER_TYPES.AI_ADMIN], // 관리자만 수정 가능
      },
    ],
  },
]
