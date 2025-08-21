import { useSWRConfig } from 'swr';
import { useCopyToClipboard } from 'usehooks-ts';

import type { Vote } from '@/lib/db/schema';

import { CopyIcon, ThumbDownIcon, ThumbUpIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import { toast } from 'sonner';
import type { ChatMessage } from '@/lib/types';

/**
 * 메시지 액션 컴포넌트 (순수 컴포넌트)
 *
 * 이 컴포넌트의 주요 기능:
 * 1. AI 메시지에 대한 사용자 액션 제공 (복사, 좋아요/싫어요)
 * 2. 클립보드 복사: 메시지의 텍스트 부분만 추출하여 복사
 * 3. 투표 시스템: AI 응답의 품질에 대한 피드백 수집
 * 4. 낙관적 업데이트: 서버 요청 전 UI 즉시 반영
 * 5. 토스트 알림: 사용자에게 액션 결과 피드백 제공
 *
 * 표시 조건:
 * - 로딩 중이 아닐 때
 * - AI 메시지일 때 (사용자 메시지에는 표시하지 않음)
 *
 * 사용 시나리오:
 * - 사용자가 AI의 좋은 답변을 복사하고 싶을 때
 * - AI 응답 품질에 대한 피드백을 남기고 싶을 때
 * - 모델 개선을 위한 데이터 수집
 */
export function PureMessageActions({
  chatId,
  message,
  vote,
  isLoading,
}: {
  chatId: string; // 채팅방 ID
  message: ChatMessage; // 대상 메시지 객체
  vote: Vote | undefined; // 현재 메시지에 대한 투표 상태
  isLoading: boolean; // 메시지 로딩 상태
}) {
  // SWR 캐시 조작을 위한 mutate 함수
  const { mutate } = useSWRConfig();

  // 클립보드 복사를 위한 훅 (첫 번째 반환값은 복사된 텍스트이므로 무시)
  const [_, copyToClipboard] = useCopyToClipboard();

  // 조건부 렌더링: 표시하지 않을 경우들
  if (isLoading) return null; // 로딩 중일 때는 액션 버튼 숨김
  if (message.role === 'user') return null; // 사용자 메시지에는 액션 버튼 표시하지 않음

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        {/* 복사 버튼 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async () => {
                // 메시지에서 텍스트 타입 부분만 추출하여 복사
                // 다른 타입(이미지, 도구 호출 등)은 제외하고 순수 텍스트만
                const textFromParts = message.parts
                  ?.filter((part) => part.type === 'text') // 텍스트 타입만 필터링
                  .map((part) => part.text) // 텍스트 내용 추출
                  .join('\n') // 여러 텍스트 부분을 줄바꿈으로 연결
                  .trim(); // 앞뒤 공백 제거

                // 복사할 텍스트가 없는 경우 에러 표시
                if (!textFromParts) {
                  toast.error('복사할 텍스트가 없습니다.');
                  return;
                }

                // 클립보드에 복사 실행
                await copyToClipboard(textFromParts);
                toast.success('클립보드에 복사되었습니다.');
              }}
            >
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>복사</TooltipContent>
        </Tooltip>
        {/* 좋아요 버튼 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-upvote"
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              disabled={vote?.isUpvoted}
              variant="outline"
              onClick={async () => {
                const upvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: 'up',
                  }),
                });

                toast.promise(upvote, {
                  loading: '좋은 응답으로 저장중...',
                  success: () => {
                    mutate<Array<Vote>>(
                      `/api/vote?chatId=${chatId}`,
                      (currentVotes) => {
                        if (!currentVotes) return [];

                        const votesWithoutCurrent = currentVotes.filter(
                          (vote) => vote.messageId !== message.id,
                        );

                        return [
                          ...votesWithoutCurrent,
                          {
                            chatId,
                            messageId: message.id,
                            isUpvoted: true,
                          },
                        ];
                      },
                      { revalidate: false },
                    );

                    return '좋은 응답으로 저장되었어요!';
                  },
                  error: '좋은 응답으로 저장하는데 실패했어요.',
                });
              }}
            >
              <ThumbUpIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>좋은 응답</TooltipContent>
        </Tooltip>

        {/* 싫어요 버튼 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-testid="message-downvote"
              className="py-1 px-2 h-fit text-muted-foreground !pointer-events-auto"
              variant="outline"
              disabled={vote && !vote.isUpvoted} // 이미 싫어요를 눌렀으면 비활성화
              onClick={async () => {
                // 서버에 싫어요 투표 요청
                const downvote = fetch('/api/vote', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    chatId,
                    messageId: message.id,
                    type: 'down', // 싫어요 타입
                  }),
                });

                // 토스트와 함께 Promise 처리 (로딩/성공/실패 상태 표시)
                toast.promise(downvote, {
                  loading: '별로인 응답으로 저장 중...', // 로딩 중 메시지
                  success: () => {
                    // 성공 시: SWR 캐시 즉시 업데이트 (낙관적 업데이트)
                    mutate<Array<Vote>>(
                      `/api/vote?chatId=${chatId}`, // 캐시 키
                      (currentVotes) => {
                        if (!currentVotes) return [];

                        // 현재 메시지의 기존 투표 제거 (중복 방지)
                        const votesWithoutCurrent = currentVotes.filter(
                          (vote) => vote.messageId !== message.id,
                        );

                        // 새로운 싫어요 투표 추가
                        return [
                          ...votesWithoutCurrent,
                          {
                            chatId,
                            messageId: message.id,
                            isUpvoted: false, // 싫어요 상태
                          },
                        ];
                      },
                      { revalidate: false }, // 서버 재검증 없이 캐시만 업데이트
                    );

                    return '별로인 응답으로 저장되었어요!'; // 성공 메시지
                  },
                  error: '별로인 응답으로 저장하는데 실패했어요.', // 실패 메시지
                });
              }}
            >
              <ThumbDownIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>별로인 응답</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

/**
 * 메모이제이션된 MessageActions 컴포넌트
 *
 * 성능 최적화를 위한 React.memo 적용:
 * - vote 상태가 변경될 때만 리렌더링 (투표 결과 반영)
 * - isLoading 상태가 변경될 때만 리렌더링 (로딩 상태 변화)
 * - 기타 props 변경 시에는 리렌더링하지 않음
 *
 * 최적화 효과:
 * - 채팅 메시지가 많을 때 불필요한 리렌더링 방지
 * - 투표 버튼 클릭 시 다른 메시지의 액션 버튼은 리렌더링되지 않음
 * - 전체적인 UI 반응성 향상
 */
export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    // vote 상태 변경 시 리렌더링 (deep equality 검사)
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    // 로딩 상태 변경 시 리렌더링
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    // 그 외의 경우에는 리렌더링하지 않음 (최적화)
    return true;
  },
);
