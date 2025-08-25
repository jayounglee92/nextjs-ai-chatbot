'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';

/**
 * AI 모델 선택 드롭다운 컴포넌트
 *
 * 이 컴포넌트의 주요 기능:
 * 1. 사용자 권한에 따른 사용 가능한 AI 모델 필터링
 * 2. 드롭다운 UI로 모델 선택 인터페이스 제공
 * 3. 낙관적 업데이트로 즉각적인 UI 반응
 * 4. 선택된 모델을 쿠키에 저장하여 세션 유지
 * 5. 각 모델의 이름과 설명 표시
 */
export function ModelSelector({
  session,
  selectedModelId,
  className,
}: {
  session: Session; // 사용자 세션 (권한 확인용)
  selectedModelId: string; // 현재 선택된 모델 ID
} & React.ComponentProps<typeof Button>) {
  // 드롭다운 열림/닫힘 상태
  const [open, setOpen] = useState(false);

  // 낙관적 업데이트: UI를 먼저 업데이트하고 서버 요청은 백그라운드에서 처리
  // 사용자에게 즉각적인 반응을 제공하여 UX 향상
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  // 사용자 타입별 권한 확인
  const userType = session.user.type; // 'free', 'pro', 'admin' 등
  const { availableChatModelIds } = entitlementsByUserType[userType];

  // 사용자가 사용할 수 있는 모델만 필터링
  // 예: 무료 사용자는 GPT-3.5만, 프로 사용자는 GPT-4, Claude 등 모든 모델
  const availableChatModels = chatModels.filter((chatModel) =>
    availableChatModelIds.includes(chatModel.id),
  );

  // 현재 선택된 모델 객체 찾기 (이름, 설명 등 전체 정보)
  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId,
      ),
    [optimisticModelId, availableChatModels],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {/* 드롭다운 트리거 버튼 */}
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground border-none',
          className,
        )}
      >
        <Button
          data-testid="model-selector" // 테스트용 식별자
          variant="outline"
          className="md:h-[34px] md:px-2" // 반응형 패딩과 높이
        >
          {/* 현재 선택된 모델 이름 표시 */}
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      {/* 드롭다운 메뉴 내용 */}
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {/* 사용 가능한 모든 모델을 리스트로 표시 */}
        {availableChatModels.map((chatModel) => {
          const { id } = chatModel;

          return (
            <DropdownMenuItem
              data-testid={`model-selector-item-${id}`} // 각 모델별 테스트 식별자
              key={id}
              onSelect={() => {
                // 드롭다운 닫기
                setOpen(false);

                // React 18의 startTransition으로 비긴급 업데이트 처리
                // UI 반응성을 해치지 않으면서 백그라운드에서 상태 업데이트
                startTransition(() => {
                  // 1. 낙관적 업데이트: UI 즉시 변경
                  setOptimisticModelId(id);

                  // 2. 서버 액션: 쿠키에 선택된 모델 저장
                  // 다음 페이지 로드 시에도 선택된 모델 유지
                  saveChatModelAsCookie(id);
                });
              }}
              data-active={id === optimisticModelId} // 현재 선택된 항목 표시용
              asChild
            >
              <button
                type="button"
                className="group/item flex w-full flex-row items-center justify-between gap-4"
              >
                {/* 모델 정보 영역 */}
                <div className="flex gap-4 items-center">
                  {/* 모델 이름 (예: GPT-4, Claude-3.5-Sonnet) */}

                  <chatModel.icon size={16} />

                  <div className="flex flex-col gap-1 items-start">
                    <p>{chatModel.name}</p>

                    {/* 모델 설명 (예: "Most capable model", "Fast and efficient") */}
                    <div className="text-xs text-muted-foreground">
                      {chatModel.description}
                    </div>
                  </div>
                </div>

                {/* 선택 표시 아이콘 */}
                {/* 현재 선택된 모델에만 체크 아이콘 표시 */}
                <div className="text-foreground opacity-0 group-data-[active=true]/item:opacity-100 dark:text-foreground">
                  <CheckCircleFillIcon />
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
