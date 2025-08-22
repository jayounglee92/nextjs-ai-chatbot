'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SuggestedActions } from './suggested-actions';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import type { VisibilityType } from './visibility-selector';
import type { Attachment, ChatMessage } from '@/lib/types';

/**
 * 멀티모달 입력 컴포넌트 - 채팅의 핵심 입력 인터페이스
 *
 * 주요 기능:
 * - 텍스트 입력 및 자동 높이 조절
 * - 파일 첨부 (이미지 등)
 * - 메시지 전송 및 AI 응답 중지
 * - 제안 액션 표시 (새 채팅일 때)
 * - 하단 스크롤 버튼
 * - 로컬 스토리지에 입력 내용 임시 저장
 *
 * 사용자 경험:
 * - Enter: 메시지 전송
 * - Shift+Enter: 줄바꿈
 * - 파일 드래그 앤 드롭 지원
 * - 모바일/데스크톱 반응형 디자인
 */
function PureMultimodalInput({
  chatId, // 현재 채팅방 ID
  input, // 입력 텍스트 상태
  setInput, // 입력 텍스트 업데이트 함수
  status, // 채팅 상태 ('ready', 'submitted', 'loading' 등)
  stop, // AI 응답 중지 함수
  attachments, // 첨부파일 배열
  setAttachments, // 첨부파일 업데이트 함수
  messages, // 채팅 메시지 배열
  setMessages, // 메시지 업데이트 함수
  sendMessage, // 메시지 전송 함수
  className, // 추가 CSS 클래스
  selectedVisibilityType, // 채팅 가시성 설정
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  className?: string;
  selectedVisibilityType: VisibilityType;
}) {
  // 텍스트 영역 DOM 참조 (높이 조절용)
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 현재 윈도우 크기 (모바일/데스크톱 구분용)
  const { width } = useWindowSize();

  // 컴포넌트 마운트 시 텍스트 영역 높이 초기 설정
  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  /**
   * 텍스트 내용에 맞게 텍스트 영역 높이를 자동 조절
   * 사용자가 여러 줄 입력할 때 스크롤 대신 영역이 확장됨
   */
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  /**
   * 텍스트 영역 높이를 기본값으로 재설정
   * 메시지 전송 후 입력창을 초기 크기로 복원
   */
  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  // 브라우저 로컬 스토리지에 입력 내용 임시 저장 (페이지 새로고침 대비)
  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  // 컴포넌트 초기화 시 저장된 입력 내용 복원
  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // DOM 값을 우선하고, 없으면 로컬스토리지 값 사용 (SSR 하이드레이션 처리)
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // 초기화 시에만 실행 (의존성 배열 비움)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 입력 내용이 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  /**
   * 텍스트 입력 이벤트 처리
   * 입력 내용 업데이트 및 높이 자동 조절
   */
  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  // 파일 입력 DOM 참조 (숨겨진 input 엘리먼트)
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 업로드 진행 중인 파일들의 이름 목록
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  /**
   * 폼 제출 처리 (메시지 전송)
   *
   * 실행 과정:
   * 1. URL을 현재 채팅방으로 업데이트
   * 2. 첨부파일과 텍스트를 포함한 메시지 생성
   * 3. AI에게 메시지 전송
   * 4. 입력 상태 초기화 및 포커스 설정
   */
  const submitForm = useCallback(() => {
    // 브라우저 주소를 현재 채팅방 URL로 업데이트
    window.history.replaceState({}, '', `/chat/${chatId}`);

    // 메시지 전송 (첨부파일 + 텍스트)
    sendMessage({
      role: 'user',
      parts: [
        // 첨부파일들을 메시지 파트로 변환
        ...attachments.map((attachment) => ({
          type: 'file' as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        })),
        // 텍스트 내용 추가
        {
          type: 'text',
          text: input,
        },
      ],
    });

    // 전송 후 상태 초기화
    setAttachments([]); // 첨부파일 제거
    setLocalStorageInput(''); // 로컬 스토리지 클리어
    resetHeight(); // 텍스트 영역 높이 초기화
    setInput(''); // 입력 텍스트 클리어

    // 데스크톱에서는 입력창에 다시 포커스
    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  /**
   * 개별 파일 업로드 처리
   *
   * @param file - 업로드할 파일 객체
   * @returns 업로드된 파일 정보 (URL, 이름, 타입)
   */
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 서버의 파일 업로드 API 호출
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        // 업로드 성공 시 파일 정보 반환
        return {
          url, // 파일 접근 URL
          name: pathname, // 파일 이름
          contentType: contentType, // MIME 타입
        };
      }
      // 서버 에러 메시지 표시
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      // 네트워크 에러 등 처리
      toast.error('파일 업로드에 실패했습니다. 다시 시도해주세요!');
    }
  };

  /**
   * 파일 선택 이벤트 처리 (다중 파일 업로드)
   *
   * 실행 과정:
   * 1. 선택된 파일들을 업로드 큐에 추가 (로딩 표시용)
   * 2. 모든 파일을 병렬로 업로드
   * 3. 성공한 파일들만 첨부파일 목록에 추가
   * 4. 업로드 큐 클리어
   */
  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      // 업로드 진행 상황 표시를 위해 파일명들을 큐에 추가
      setUploadQueue(files.map((file) => file.name));

      try {
        // 모든 파일을 병렬로 업로드
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);

        // 업로드 성공한 파일들만 필터링
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        // 기존 첨부파일 목록에 새로 업로드된 파일들 추가
        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('파일 업로드 중 오류 발생!', error);
      } finally {
        // 업로드 완료 후 큐 클리어 (로딩 표시 제거)
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  // 스크롤 위치 감지 및 하단 스크롤 기능
  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  // 메시지 전송 시 자동으로 하단으로 스크롤
  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  return (
    <div className="relative w-full flex flex-col gap-4">
      {/* 하단 스크롤 버튼 (스크롤이 위에 있을 때만 표시) */}
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <ArrowDown />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 제안 액션 (새 채팅일 때만 표시) */}
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            sendMessage={sendMessage}
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
        )}

      {/* 숨겨진 파일 입력 엘리먼트 (첨부파일 버튼에서 트리거) */}
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {/* 첨부파일 및 업로드 중인 파일들 미리보기 */}
      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {/* 업로드 완료된 첨부파일들 */}
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {/* 업로드 진행 중인 파일들 (로딩 표시) */}
          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      {/* 메인 텍스트 입력 영역 */}
      <Textarea
        data-testid="multimodal-input"
        ref={textareaRef}
        placeholder="무엇이든 물어보세요."
        value={input}
        onChange={handleInput}
        className={cx(
          'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700',
          className,
        )}
        rows={2}
        autoFocus
        onKeyDown={(event) => {
          // Enter 키 처리 (Shift+Enter는 줄바꿈, Enter는 전송)
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing // 한글 입력 중이 아닐 때
          ) {
            event.preventDefault();

            // AI 응답 중에는 전송 불가
            if (status !== 'ready') {
              toast.error('AI 응답이 완료될 때까지 기다려주세요!');
            } else {
              submitForm();
            }
          }
        }}
      />

      {/* 왼쪽 하단: 첨부파일 버튼 */}
      <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
        <AttachmentsButton fileInputRef={fileInputRef} status={status} />
      </div>

      {/* 오른쪽 하단: 전송/중지 버튼 */}
      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        {status === 'submitted' ? (
          <StopButton stop={stop} setMessages={setMessages} />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={uploadQueue}
          />
        )}
      </div>
    </div>
  );
}

// 성능 최적화를 위한 메모이제이션 (props 변경 시에만 리렌더링)
export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);

/**
 * 첨부파일 버튼 컴포넌트
 * 클릭 시 숨겨진 파일 입력 엘리먼트를 트리거하여 파일 선택 창 열기
 */
function PureAttachmentsButton({
  fileInputRef, // 파일 입력 엘리먼트 참조
  status, // 채팅 상태 (ready일 때만 활성화)
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        // 숨겨진 파일 입력 엘리먼트 클릭 트리거
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'} // AI 응답 중에는 비활성화
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

/**
 * 중지 버튼 컴포넌트
 * AI 응답 진행 중일 때 표시되며, 클릭 시 응답 생성을 중단
 */
function PureStopButton({
  stop, // AI 응답 중지 함수
  setMessages, // 메시지 상태 업데이트 함수
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop(); // AI 응답 중지
        setMessages((messages) => messages); // 메시지 상태 새로고침
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

/**
 * 전송 버튼 컴포넌트
 * 입력이 있고 파일 업로드가 진행 중이 아닐 때 활성화
 */
function PureSendButton({
  submitForm, // 메시지 전송 함수
  input, // 입력 텍스트
  uploadQueue, // 업로드 진행 중인 파일 목록
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      // 입력이 없거나 파일 업로드 중일 때 비활성화
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

// 성능 최적화를 위한 메모이제이션 (입력과 업로드 큐 변경 시에만 리렌더링)
const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
