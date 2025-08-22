'use client';

import { Button } from './ui/button';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Textarea } from './ui/textarea';
import { deleteTrailingMessages } from '@/app/(chat)/actions';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';
import { getTextFromMessage } from '@/lib/utils';

/**
 * MessageEditor 컴포넌트의 Props 타입 정의
 */
export type MessageEditorProps = {
  message: ChatMessage; // 편집할 메시지 객체
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>; // 보기/편집 모드 전환 함수
  setMessages: UseChatHelpers<ChatMessage>['setMessages']; // 메시지 목록 업데이트 함수
  regenerate: UseChatHelpers<ChatMessage>['regenerate']; // AI 응답 재생성 함수
};

/**
 * 메시지 편집 컴포넌트
 *
 * 이 컴포넌트의 주요 기능:
 * 1. 사용자 메시지 내용 편집 인터페이스 제공
 * 2. 자동 높이 조절되는 텍스트 입력 영역
 * 3. 편집 취소 및 저장 기능
 * 4. 메시지 편집 시 후속 메시지 자동 삭제
 * 5. 편집 완료 후 AI 응답 재생성
 *
 * 사용 시나리오:
 * - 사용자가 이전에 보낸 메시지를 수정하고 싶을 때
 * - 오타나 내용 수정 후 AI 응답을 다시 받고 싶을 때
 * - 대화의 흐름을 바꾸고 싶을 때
 */
export function MessageEditor({
  message,
  setMode,
  setMessages,
  regenerate,
}: MessageEditorProps) {
  // 메시지 전송 중 상태 (중복 전송 방지)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 편집 중인 메시지 내용 (임시 저장)
  const [draftContent, setDraftContent] = useState<string>(
    getTextFromMessage(message), // 기존 메시지에서 텍스트 추출하여 초기값 설정
  );

  // 텍스트 영역 DOM 참조 (높이 자동 조절용)
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 컴포넌트 마운트 시 텍스트 영역 높이 초기 조절
  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  /**
   * 텍스트 영역 높이 자동 조절 함수
   *
   * 동작 방식:
   * 1. 높이를 'auto'로 리셋하여 실제 콘텐츠 높이 측정
   * 2. scrollHeight를 기반으로 적절한 높이 설정
   * 3. 2px 여유 공간 추가로 스크롤바 방지
   */
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // 높이 리셋
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`; // 콘텐츠에 맞는 높이 설정
    }
  };

  /**
   * 텍스트 입력 처리 함수
   *
   * 입력할 때마다:
   * 1. 임시 콘텐츠 상태 업데이트
   * 2. 텍스트 영역 높이 자동 조절
   */
  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight(); // 입력할 때마다 높이 재조절
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* 편집 가능한 텍스트 영역 */}
      <Textarea
        data-testid="message-editor" // 테스트용 식별자
        ref={textareaRef}
        className="bg-transparent outline-none overflow-hidden resize-none !text-base rounded-xl w-full"
        value={draftContent}
        onChange={handleInput}
      />

      {/* 액션 버튼들 (취소, 전송) */}
      <div className="flex flex-row gap-2 justify-end">
        {/* 취소 버튼 */}
        <Button
          variant="outline"
          className="h-fit py-2 px-3"
          onClick={() => {
            setMode('view'); // 편집 모드 종료, 보기 모드로 전환
          }}
        >
          취소
        </Button>

        {/* 전송 버튼 */}
        <Button
          data-testid="message-editor-send-button"
          variant="default"
          className="h-fit py-2 px-3"
          disabled={isSubmitting} // 전송 중일 때 비활성화
          onClick={async () => {
            setIsSubmitting(true); // 전송 시작

            // 1단계: 편집하는 메시지 이후의 모든 메시지 삭제
            // 왜냐하면 메시지를 수정하면 이후 대화 맥락이 달라지기 때문
            await deleteTrailingMessages({
              id: message.id,
            });

            // 2단계: 메시지 목록에서 편집된 메시지로 교체
            setMessages((messages) => {
              // 편집할 메시지의 인덱스 찾기
              const index = messages.findIndex((m) => m.id === message.id);

              if (index !== -1) {
                // 새로운 메시지 객체 생성 (편집된 텍스트로)
                const updatedMessage: ChatMessage = {
                  ...message, // 기존 메시지 정보 유지
                  parts: [{ type: 'text', text: draftContent }], // 텍스트 부분만 교체
                };

                // 편집된 메시지까지만 포함한 새 배열 반환
                // (이후 메시지들은 이미 서버에서 삭제됨)
                return [...messages.slice(0, index), updatedMessage];
              }

              // 메시지를 찾지 못한 경우 기존 배열 반환
              return messages;
            });

            // 3단계: 편집 모드 종료
            setMode('view');

            // 4단계: AI 응답 재생성
            // 편집된 메시지를 기반으로 새로운 AI 응답 생성
            regenerate();
          }}
        >
          {/* 전송 상태에 따른 버튼 텍스트 변경 */}
          {isSubmitting ? '전송중...' : '전송'}
        </Button>
      </div>
    </div>
  );
}
