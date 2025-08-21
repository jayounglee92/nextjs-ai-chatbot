'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

/**
 * 메인 채팅 컴포넌트
 *
 * 이 컴포넌트의 주요 역할:
 * 1. AI와의 실시간 대화 인터페이스 제공
 * 2. 메시지 상태 관리 (전송, 수신, 스트리밍)
 * 3. 채팅 가시성 및 모델 설정 관리
 * 4. 파일 첨부 및 아티팩트 기능 지원
 * 5. URL 쿼리 파라미터로부터 자동 메시지 전송
 * 6. 투표 시스템 및 히스토리 동기화
 */
export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string; // 채팅방 고유 ID
  initialMessages: ChatMessage[]; // 초기 메시지 목록 (서버에서 로드된 기존 대화)
  initialChatModel: string; // 사용할 AI 모델 ID (GPT-4, Claude 등)
  initialVisibilityType: VisibilityType; // 채팅 공개/비공개 설정
  isReadonly: boolean; // 읽기 전용 모드 여부 (공유된 채팅 등)
  session: Session; // 사용자 세션 정보
  autoResume: boolean; // 중단된 스트리밍 자동 재개 여부
}) {
  // 채팅 가시성 상태 관리 (Public/Private 전환)
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  // SWR 캐시 관리 및 데이터 스트림 상태
  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  // 사용자 입력 텍스트 상태
  const [input, setInput] = useState<string>('');

  // AI SDK의 useChat 훅으로 채팅 기능 구현
  const {
    messages, // 현재 대화의 모든 메시지
    setMessages, // 메시지 목록 수동 업데이트
    sendMessage, // 새 메시지 전송
    status, // 채팅 상태 ('submitted', 'streaming', 'ready', 'error' 등)
    stop, // 스트리밍 중단
    regenerate, // 마지막 AI 응답 재생성
    resumeStream, // 중단된 스트리밍 재개
  } = useChat<ChatMessage>({
    id, // 채팅 세션 ID
    messages: initialMessages, // 초기 메시지로 시작
    experimental_throttle: 100, // 스트리밍 업데이트 간격 (100ms)
    generateId: generateUUID, // 메시지 ID 생성 함수

    // 커스텀 전송 설정
    transport: new DefaultChatTransport({
      api: '/api/chat', // 채팅 API 엔드포인트
      fetch: fetchWithErrorHandlers, // 에러 처리가 포함된 fetch 함수

      // 서버로 전송할 요청 데이터 준비
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id, // 채팅 ID
            message: messages.at(-1), // 가장 최근 메시지 (사용자가 방금 보낸 것)
            selectedChatModel: initialChatModel, // 선택된 AI 모델
            selectedVisibilityType: visibilityType, // 현재 가시성 설정
            ...body, // 추가 데이터 (첨부파일 등)
          },
        };
      },
    }),

    // 스트리밍 데이터 수신 시 콜백
    onData: (dataPart) => {
      // 실시간으로 받은 데이터를 스트림에 추가
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },

    // 메시지 완료 시 콜백
    onFinish: () => {
      // 채팅 히스토리 캐시를 무효화하여 사이드바 업데이트
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },

    // 에러 발생 시 콜백
    onError: (error) => {
      // ChatSDKError인 경우 토스트로 사용자에게 알림
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  // URL 쿼리 파라미터에서 초기 질문 추출
  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  // 쿼리 파라미터 처리 상태 (중복 전송 방지)
  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  // URL 쿼리로부터 자동 메시지 전송 처리
  useEffect(() => {
    // 쿼리가 있고 아직 처리하지 않은 경우
    if (query && !hasAppendedQuery) {
      // 쿼리 내용을 사용자 메시지로 자동 전송
      sendMessage({
        role: 'user' as const,
        parts: [{ type: 'text', text: query }],
      });

      // 중복 처리 방지 플래그 설정
      setHasAppendedQuery(true);

      // URL에서 쿼리 파라미터 제거 (깔끔한 URL 유지)
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, sendMessage, hasAppendedQuery, id]);

  // 투표 데이터 조회 (메시지가 2개 이상일 때만)
  // 사용자 질문 + AI 답변이 있어야 투표 가능
  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  // 파일 첨부 상태 관리
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  // 아티팩트 패널 표시 여부 (코드, 이미지 등 생성물)
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // 중단된 스트리밍 자동 재개 기능
  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      {/* 메인 채팅 인터페이스 */}
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        {/* 채팅 헤더 (제목, 설정 버튼 등) */}
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        {/* 메시지 목록 영역 */}
        <Messages
          chatId={id}
          status={status} // 로딩/스트리밍 상태
          votes={votes} // 투표 데이터
          messages={messages} // 모든 메시지
          setMessages={setMessages}
          regenerate={regenerate} // 재생성 기능
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        {/* 메시지 입력 폼 */}
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {/* 읽기 전용이 아닐 때만 입력 가능 */}
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              status={status}
              stop={stop}
              attachments={attachments} // 파일 첨부
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              sendMessage={sendMessage}
              selectedVisibilityType={visibilityType}
            />
          )}
        </form>
      </div>

      {/* 아티팩트 패널 (코드 실행, 이미지 편집 등) */}
      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        sendMessage={sendMessage}
        messages={messages}
        setMessages={setMessages}
        regenerate={regenerate}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}
