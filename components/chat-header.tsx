'use client'

import { useRouter } from 'next/navigation'
import { useWindowSize } from 'usehooks-ts'

import { SidebarToggle } from '@/components/sidebar-toggle'
import { useSidebar } from './ui/sidebar'
import { memo } from 'react'
import { type VisibilityType, VisibilitySelector } from './visibility-selector'
import type { Session } from 'next-auth'
import { ModelSelector } from './model-selector'
import { SidebarUserNav } from './sidebar-user-nav'

/**
 * 채팅 헤더의 순수 컴포넌트 (메모이제이션 최적화를 위해 분리)
 *
 * 이 컴포넌트의 주요 기능:
 * 1. 사이드바 토글 버튼
 * 2. 새 채팅 시작 버튼 (반응형 조건부 표시)
 * 3. AI 모델 선택기 (읽기 전용이 아닐 때만)
 * 4. 채팅 가시성 선택기 (공개/비공개 설정)
 * 5. Vercel 배포 링크 (데스크톱에서만 표시)
 */
function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  session,
}: {
  chatId: string // 현재 채팅방의 고유 ID
  selectedModelId: string // 현재 선택된 AI 모델 ID
  selectedVisibilityType: VisibilityType // 채팅 가시성 설정 (public/private)
  isReadonly: boolean // 읽기 전용 모드 여부 (공유된 채팅 등)
  session: Session // 사용자 세션 정보
}) {
  // 페이지 네비게이션을 위한 라우터
  const router = useRouter()

  // 사이드바 열림/닫힘 상태
  const { open } = useSidebar()

  // 현재 브라우저 창 크기 (반응형 UI를 위해)
  const { width: windowWidth } = useWindowSize()

  return (
    <header className="flex sticky shadow-sm top-0 bg-background p-2 items-center gap-2 bg-white">
      {/* 사이드바 열기/닫기 토글 버튼 */}
      <SidebarToggle />
      {/* 새 채팅 시작 버튼 - 조건부 표시 */}
      {/* 사이드바가 닫혀있거나 모바일 화면일 때만 표시 */}
      {(!open || windowWidth < 768) &&
        // <Tooltip>
        //   <TooltipTrigger asChild>
        //     <Button
        //       variant="outline"
        //       className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
        //       onClick={() => {
        //         // 홈페이지로 이동하여 새 채팅 시작
        //         router.push('/');
        //         router.refresh(); // 페이지 새로고침으로 상태 초기화
        //       }}
        //     >
        //       <PlusIcon />
        //       {/* 모바일에서는 텍스트 숨김 (아이콘만 표시) */}
        //       <span className="md:sr-only">새 채팅</span>
        //     </Button>
        //   </TooltipTrigger>
        //   <TooltipContent>새 채팅</TooltipContent>
        // </Tooltip>
        null}
      {/* 채팅 가시성 선택기 (Public/Private) - 편집 가능한 채팅에서만 표시 */}
      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
        />
      )}
      <div className="ml-auto">
        {session && <SidebarUserNav user={session.user} />}
      </div>
    </header>
  )
}

/**
 * 메모이제이션된 채팅 헤더 컴포넌트
 *
 * React.memo를 사용하여 성능 최적화:
 * - selectedModelId가 변경될 때만 리렌더링
 * - 다른 props가 변경되어도 모델이 같으면 리렌더링 방지
 *
 * 이렇게 최적화하는 이유:
 * - 헤더는 자주 변경되지 않는 UI 요소
 * - 채팅 메시지가 업데이트될 때마다 불필요한 리렌더링 방지
 * - 전체 앱 성능 향상에 기여
 */
export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId
})
