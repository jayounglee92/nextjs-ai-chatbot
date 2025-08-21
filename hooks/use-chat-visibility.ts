'use client';

import { useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { unstable_serialize } from 'swr/infinite';
import { updateChatVisibility } from '@/app/(chat)/actions';
import {
  getChatHistoryPaginationKey,
  type ChatHistory,
} from '@/components/sidebar-history';
import type { VisibilityType } from '@/components/visibility-selector';

/**
 * 채팅 가시성(Public/Private) 상태 관리 훅
 *
 * 이 훅의 주요 역할:
 * 1. 채팅방의 공개/비공개 상태를 관리
 * 2. 로컬 상태와 서버 상태를 동기화
 * 3. 채팅 히스토리에서 실제 가시성 상태를 우선적으로 사용
 * 4. 가시성 변경 시 캐시 무효화 및 서버 업데이트 처리
 */
export function useChatVisibility({
  chatId,
  initialVisibilityType,
}: {
  chatId: string; // 대상 채팅방의 고유 ID
  initialVisibilityType: VisibilityType; // 초기 가시성 타입 (fallback 값)
}) {
  // SWR 설정: 캐시 조작과 데이터 재검증을 위한 도구들
  const { mutate, cache } = useSWRConfig();

  // 캐시에서 채팅 히스토리 데이터를 직접 가져오기
  // 이미 로드된 히스토리 데이터가 있다면 재사용
  const history: ChatHistory = cache.get('/api/history')?.data;

  // 로컬 가시성 상태 관리
  // 각 채팅방마다 고유한 키로 로컬 상태를 저장
  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`, // 채팅방별 고유 키
    null, // fetcher 없음 (로컬 상태만 관리)
    {
      fallbackData: initialVisibilityType, // 초기값으로 사용할 가시성 타입
    },
  );

  // 실제 가시성 타입 결정 로직
  // 우선순위: 서버 히스토리 > 로컬 상태 > 기본값('private')
  const visibilityType = useMemo(() => {
    // 1. 히스토리 데이터가 없으면 로컬 상태 사용
    if (!history) return localVisibility;

    // 2. 히스토리에서 현재 채팅방 찾기
    const chat = history.chats.find((chat) => chat.id === chatId);

    // 3. 채팅방이 히스토리에 없으면 기본값 'private' 사용
    if (!chat) return 'private';

    // 4. 히스토리에 있는 실제 가시성 상태 반환
    return chat.visibility;
  }, [history, chatId, localVisibility]);

  // 가시성 타입 변경 함수
  const setVisibilityType = (updatedVisibilityType: VisibilityType) => {
    // 1. 로컬 상태 즉시 업데이트 (UI 반응성을 위해)
    setLocalVisibility(updatedVisibilityType);

    // 2. 채팅 히스토리 캐시 무효화
    // 히스토리 목록을 다시 불러와서 최신 상태로 동기화
    mutate(unstable_serialize(getChatHistoryPaginationKey));

    // 3. 서버에 가시성 변경 요청 전송
    // 실제 데이터베이스에 변경사항 저장
    updateChatVisibility({
      chatId: chatId,
      visibility: updatedVisibilityType,
    });
  };

  // 현재 가시성 상태와 변경 함수 반환
  return { visibilityType, setVisibilityType };
}
