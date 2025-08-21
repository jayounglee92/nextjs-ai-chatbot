import { PreviewMessage, ThinkingMessage } from './message';
import { Greeting } from './greeting';
import { memo } from 'react';
import type { Vote } from '@/lib/db/schema';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { useMessages } from '@/hooks/use-messages';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

/**
 * Messages 컴포넌트의 Props 인터페이스
 */
interface MessagesProps {
  chatId: string; // 현재 채팅방 ID
  status: UseChatHelpers<ChatMessage>['status']; // 채팅 상태 ('submitted', 'streaming', 'ready', 'error')
  votes: Array<Vote> | undefined; // 메시지별 투표 데이터 (좋아요/싫어요)
  messages: ChatMessage[]; // 채팅 메시지 배열
  setMessages: UseChatHelpers<ChatMessage>['setMessages']; // 메시지 업데이트 함수
  regenerate: UseChatHelpers<ChatMessage>['regenerate']; // 마지막 AI 응답 재생성 함수
  isReadonly: boolean; // 읽기 전용 모드 여부
  isArtifactVisible: boolean; // 아티팩트 패널 표시 여부
}

/**
 * 채팅 메시지 목록을 표시하는 순수 컴포넌트
 *
 * 이 컴포넌트의 주요 기능:
 * 1. 채팅 메시지들을 순차적으로 렌더링
 * 2. 빈 채팅방일 때 환영 메시지 표시
 * 3. 스트리밍 중인 메시지에 로딩 상태 표시
 * 4. 사용자 메시지 전송 후 "생각 중..." 상태 표시
 * 5. 자동 스크롤 및 뷰포트 감지 기능
 * 6. 메시지별 투표 시스템 지원
 */
function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
}: MessagesProps) {
  // 메시지 스크롤 관리 및 뷰포트 감지를 위한 훅
  const {
    containerRef: messagesContainerRef, // 메시지 컨테이너 참조
    endRef: messagesEndRef, // 메시지 끝 지점 참조 (자동 스크롤용)
    onViewportEnter, // 메시지 끝이 뷰포트에 들어올 때 콜백
    onViewportLeave, // 메시지 끝이 뷰포트에서 벗어날 때 콜백
    hasSentMessage, // 사용자가 메시지를 보냈는지 여부
  } = useMessages({
    chatId,
    status,
  });

  // 데이터 스트림 훅 (아티팩트 관련 실시간 데이터 처리)
  useDataStream();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
    >
      {/* 메시지가 없을 때 환영 인사 표시 */}
      {messages.length === 0 && <Greeting />}

      {/* 모든 메시지를 순서대로 렌더링 */}
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={status === 'streaming' && messages.length - 1 === index}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
          requiresScrollPadding={
            hasSentMessage && index === messages.length - 1
          }
        />
      ))}

      {/* "생각 중..." 메시지 표시 조건:
          1. 상태가 'submitted' (사용자가 메시지를 보냄)
          2. 메시지가 1개 이상 있음
          3. 마지막 메시지가 사용자 메시지임 */}
      {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      {/* 메시지 끝 지점 마커 (자동 스크롤 및 뷰포트 감지용) */}
      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave} // 뷰포트에서 벗어날 때
        onViewportEnter={onViewportEnter} // 뷰포트에 들어올 때
      />
    </div>
  );
}

/**
 * 메모이제이션된 Messages 컴포넌트
 *
 * 복잡한 최적화 로직을 통해 불필요한 리렌더링을 방지합니다.
 *
 * 최적화 전략:
 * 1. 아티팩트가 둘 다 보이는 상태면 리렌더링 스킵
 * 2. 상태, 메시지 수, 메시지 내용, 투표 데이터 변경 시에만 리렌더링
 * 3. deep equality 검사로 정확한 변경 감지
 *
 * 왜 이렇게 최적화하는가?
 * - 메시지가 많을 때 성능 향상
 * - 스트리밍 중 불필요한 전체 리렌더링 방지
 * - 아티팩트 패널과의 상호작용 시 성능 유지
 */
export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  // 아티팩트가 둘 다 보이는 상태면 변경사항 무시 (성능 최적화)
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  // 채팅 상태가 변경되면 리렌더링 필요
  if (prevProps.status !== nextProps.status) return false;

  // 메시지 개수가 변경되면 리렌더링 필요
  if (prevProps.messages.length !== nextProps.messages.length) return false;

  // 메시지 내용이 변경되면 리렌더링 필요 (deep equality 검사)
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  // 투표 데이터가 변경되면 리렌더링 필요
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  // 모든 조건을 통과하면 리렌더링 하지 않음
  return false;
});
