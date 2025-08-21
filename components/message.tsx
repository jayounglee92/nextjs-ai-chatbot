'use client';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import type { Vote } from '@/lib/db/schema';
import { DocumentToolCall, DocumentToolResult } from './document';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Weather } from './weather';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { DocumentPreview } from './document-preview';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

// AI SDK의 타입 추론 시스템이 도구 호출에 대한 차별화된 유니온 타입을 제공
// TypeScript의 제어 흐름 분석으로 타입 좁히기 처리

/**
 * 개별 채팅 메시지를 렌더링하는 순수 컴포넌트
 *
 * 이 컴포넌트의 주요 기능:
 * 1. 사용자/AI 메시지 구분 렌더링
 * 2. 다양한 메시지 타입 처리 (텍스트, 도구 호출, 첨부파일 등)
 * 3. 메시지 편집 모드 지원
 * 4. 도구 호출 결과 표시 (날씨, 문서, 제안 등)
 * 5. 애니메이션과 인터랙션 효과
 * 6. 접근성과 테스트 지원
 */
const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string; // 현재 채팅방 ID
  message: ChatMessage; // 렌더링할 메시지 객체
  vote: Vote | undefined; // 메시지에 대한 투표 정보 (좋아요/싫어요)
  isLoading: boolean; // 스트리밍 로딩 상태 (마지막 메시지에만 적용)
  setMessages: UseChatHelpers<ChatMessage>['setMessages']; // 메시지 업데이트 함수
  regenerate: UseChatHelpers<ChatMessage>['regenerate']; // AI 응답 재생성 함수
  isReadonly: boolean; // 읽기 전용 모드 (편집/액션 비활성화)
  requiresScrollPadding: boolean; // 스크롤 패딩 필요 여부 (마지막 메시지)
}) => {
  // 메시지 표시/편집 모드 상태 관리
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  // 메시지에서 파일 첨부 부분만 필터링
  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === 'file',
  );

  // 데이터 스트림 훅 (아티팩트 관련 실시간 데이터 처리)
  useDataStream();

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`} // 테스트용 식별자
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }} // 등장 애니메이션 초기값
        animate={{ y: 0, opacity: 1 }} // 등장 애니메이션 최종값
        data-role={message.role} // CSS 선택자용 역할 속성
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit', // 편집 모드일 때 전체 너비
              'group-data-[role=user]/message:w-fit': mode !== 'edit', // 보기 모드일 때 사용자 메시지는 내용에 맞춤
            },
          )}
        >
          {/* AI 메시지인 경우에만 아바타 표시 */}
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              // AI 메시지이고 스크롤 패딩이 필요한 경우 최소 높이 설정
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {/* 첨부파일이 있는 경우 미리보기 표시 */}
            {attachmentsFromMessage.length > 0 && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2" // 우측 정렬
              >
                {attachmentsFromMessage.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={{
                      name: attachment.filename ?? 'file',
                      contentType: attachment.mediaType,
                      url: attachment.url,
                    }}
                  />
                ))}
              </div>
            )}

            {/* 메시지의 각 부분(part)을 타입에 따라 렌더링 */}
            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              // AI의 사고 과정 표시 (reasoning 타입)
              if (type === 'reasoning' && part.text?.trim().length > 0) {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.text}
                  />
                );
              }

              // 일반 텍스트 메시지 처리
              if (type === 'text') {
                // 보기 모드: 텍스트 표시 + 편집 버튼
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      {/* 사용자 메시지이고 읽기 전용이 아닌 경우 편집 버튼 표시 */}
                      {message.role === 'user' && !isReadonly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit'); // 편집 모드로 전환
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                      )}

                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          // 사용자 메시지는 말풍선 스타일 적용
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                            message.role === 'user',
                        })}
                      >
                        {/* 마크다운 렌더링 (XSS 방지를 위한 텍스트 정제) */}
                        <Markdown>{sanitizeText(part.text)}</Markdown>
                      </div>
                    </div>
                  );
                }

                // 편집 모드: 메시지 에디터 표시
                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" /> {/* 아바타 공간 확보 */}
                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode} // 모드 전환 함수
                        setMessages={setMessages}
                        regenerate={regenerate}
                      />
                    </div>
                  );
                }
              }

              // 날씨 도구 호출 처리
              if (type === 'tool-getWeather') {
                const { toolCallId, state } = part;

                // 입력 단계: 로딩 상태 표시
                if (state === 'input-available') {
                  return (
                    <div key={toolCallId} className="skeleton">
                      <Weather />
                    </div>
                  );
                }

                // 출력 단계: 실제 날씨 데이터 표시
                if (state === 'output-available') {
                  const { output } = part;
                  return (
                    <div key={toolCallId}>
                      <Weather weatherAtLocation={output} />
                    </div>
                  );
                }
              }

              // 문서 생성 도구 호출 처리
              if (type === 'tool-createDocument') {
                const { toolCallId, state } = part;
                // state 타입 종류
                // input-streaming : 입력 스트리밍 중
                // input-available : 입력 준비 완료
                // output-available : 출력 완료
                // output-error : 출력 오류

                // 입력 단계: 문서 생성 요청 정보 표시
                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentPreview isReadonly={isReadonly} args={input} />
                    </div>
                  );
                }

                // 출력 단계: 생성된 문서 또는 에러 표시
                if (state === 'output-available') {
                  const { output } = part;

                  // 에러 발생 시 에러 메시지 표시
                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  // 성공 시 문서 미리보기 표시
                  return (
                    <div key={toolCallId}>
                      <DocumentPreview
                        isReadonly={isReadonly}
                        result={output}
                      />
                    </div>
                  );
                }
              }

              // 문서 업데이트 도구 호출 처리
              if (type === 'tool-updateDocument') {
                const { toolCallId, state } = part;

                // 입력 단계: 업데이트 요청 정보 표시
                if (state === 'input-available') {
                  const { input } = part;

                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="update"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                // 출력 단계: 업데이트 결과 또는 에러 표시
                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="update"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }

              // 제안 요청 도구 호출 처리
              if (type === 'tool-requestSuggestions') {
                const { toolCallId, state } = part;

                // 입력 단계: 제안 요청 정보 표시
                if (state === 'input-available') {
                  const { input } = part;
                  return (
                    <div key={toolCallId}>
                      <DocumentToolCall
                        type="request-suggestions"
                        args={input}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }

                // 출력 단계: 제안 결과 또는 에러 표시
                if (state === 'output-available') {
                  const { output } = part;

                  if ('error' in output) {
                    return (
                      <div
                        key={toolCallId}
                        className="text-red-500 p-2 border rounded"
                      >
                        Error: {String(output.error)}
                      </div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <DocumentToolResult
                        type="request-suggestions"
                        result={output}
                        isReadonly={isReadonly}
                      />
                    </div>
                  );
                }
              }
            })}

            {/* 메시지 액션 버튼들 (투표, 복사, 재생성 등) */}
            {/* 읽기 전용이 아닐 때만 표시 */}
            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * 메모이제이션된 PreviewMessage 컴포넌트
 *
 * 성능 최적화를 위해 다음 조건에서만 리렌더링:
 * 1. 로딩 상태 변경
 * 2. 메시지 ID 변경 (다른 메시지로 교체)
 * 3. 스크롤 패딩 요구사항 변경
 * 4. 메시지 내용 변경 (deep equality 검사)
 * 5. 투표 정보 변경
 *
 * 이렇게 최적화하는 이유:
 * - 메시지 컴포넌트는 복잡한 렌더링 로직을 가짐
 * - 스트리밍 중 불필요한 리렌더링 방지
 * - 도구 호출 결과 표시 시 성능 유지
 */
export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    // 로딩 상태가 변경되면 리렌더링 (스트리밍 시작/종료)
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    // 메시지 ID가 다르면 리렌더링 (완전히 다른 메시지)
    if (prevProps.message.id !== nextProps.message.id) return false;

    // 스크롤 패딩 요구사항이 변경되면 리렌더링
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;

    // 메시지 내용이 변경되면 리렌더링 (deep equality 검사)
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

    // 투표 정보가 변경되면 리렌더링
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    // 모든 조건을 통과하면 리렌더링 하지 않음
    return false;
  },
);

/**
 * AI가 사용자 메시지를 처리 중임을 나타내는 "생각 중..." 메시지 컴포넌트
 *
 * 언제 표시되는가?:
 * - 사용자가 메시지를 보낸 직후 (status === 'submitted')
 * - AI가 아직 응답을 시작하지 않은 상태
 * - 사용자에게 "처리 중"임을 알려주는 시각적 피드백
 *
 * 특징:
 * - 1초 딜레이 후 부드럽게 나타남 (transition: { delay: 1 })
 * - AI 아바타와 "Hmm..." 텍스트 표시
 * - 최소 높이 설정으로 레이아웃 안정성 확보
 */
export const ThinkingMessage = () => {
  const role = 'assistant'; // AI 역할로 설정

  return (
    <motion.div
      data-testid="message-assistant-loading" // 테스트용 식별자
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }} // 등장 애니메이션 초기값
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }} // 1초 후 나타남
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        {/* AI 아바타 (SparklesIcon) */}
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        {/* "생각 중..." 텍스트 */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm... {/* 사용자에게 친근감을 주는 표현 */}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
