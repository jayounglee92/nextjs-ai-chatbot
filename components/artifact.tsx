import { formatDistance } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useDebounceCallback, useWindowSize } from 'usehooks-ts';
import type { Document, Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { Toolbar } from './toolbar';
import { VersionFooter } from './version-footer';
import { ArtifactActions } from './artifact-actions';
import { ArtifactCloseButton } from './artifact-close-button';
import { ArtifactMessages } from './artifact-messages';
import { useSidebar } from './ui/sidebar';
import { useArtifact } from '@/hooks/use-artifact';
import { imageArtifact } from '@/artifacts/image/client';
import { codeArtifact } from '@/artifacts/code/client';
import { sheetArtifact } from '@/artifacts/sheet/client';
import { textArtifact } from '@/artifacts/text/client';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';
import type { Attachment, ChatMessage } from '@/lib/types';

// 지원되는 아티팩트 타입들의 정의 배열
export const artifactDefinitions = [
  textArtifact, // 텍스트 문서
  codeArtifact, // 코드 파일
  imageArtifact, // 이미지
  sheetArtifact, // 스프레드시트
];

// 아티팩트 종류 타입 (위 배열에서 추출)
export type ArtifactKind = (typeof artifactDefinitions)[number]['kind'];

/**
 * UI에서 사용되는 아티팩트 상태 인터페이스
 */
export interface UIArtifact {
  title: string; // 아티팩트 제목
  documentId: string; // 문서 고유 ID
  kind: ArtifactKind; // 아티팩트 종류 (text, code, image, sheet)
  content: string; // 아티팩트 내용
  isVisible: boolean; // 패널 표시 여부
  status: 'streaming' | 'idle'; // 스트리밍 상태
  boundingBox: {
    // 애니메이션용 시작 위치
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

/**
 * 아티팩트 메인 컴포넌트
 *
 * 주요 기능:
 * - AI가 생성한 코드, 문서, 이미지 등을 사이드 패널에서 표시
 * - 실시간 편집 및 버전 관리
 * - 채팅과 아티팩트 간의 인터랙션
 * - 모바일/데스크톱 반응형 레이아웃
 *
 * 레이아웃 구조:
 * - 왼쪽: 채팅 인터페이스 (데스크톱만)
 * - 오른쪽: 아티팩트 콘텐츠 + 도구 모음
 */
function PureArtifact({
  chatId, // 현재 채팅방 ID
  input, // 입력 텍스트 상태
  setInput, // 입력 텍스트 업데이트 함수
  status, // 채팅 상태
  stop, // AI 응답 중지 함수
  attachments, // 첨부파일 배열
  setAttachments, // 첨부파일 업데이트 함수
  sendMessage, // 메시지 전송 함수
  messages, // 채팅 메시지 배열
  setMessages, // 메시지 상태 업데이트 함수
  regenerate, // 메시지 재생성 함수
  votes, // 메시지 투표 정보
  isReadonly, // 읽기 전용 모드 여부
  selectedVisibilityType, // 채팅 가시성 설정
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: UseChatHelpers<ChatMessage>['stop'];
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  votes: Array<Vote> | undefined;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  selectedVisibilityType: VisibilityType;
}) {
  // 아티팩트 전역 상태 및 메타데이터 관리
  const { artifact, setArtifact, metadata, setMetadata } = useArtifact();

  // 문서 버전 히스토리 데이터 fetching (SWR 사용)
  const {
    data: documents, // 문서 버전들의 배열
    isLoading: isDocumentsFetching, // 로딩 상태
    mutate: mutateDocuments, // 데이터 갱신 함수
  } = useSWR<Array<Document>>(
    // 아티팩트가 초기화되고 스트리밍 중이 아닐 때만 데이터 요청
    artifact.documentId !== 'init' && artifact.status !== 'streaming'
      ? `/api/document?id=${artifact.documentId}`
      : null,
    fetcher,
  );

  // 아티팩트 표시 모드 ('edit': 편집, 'diff': 변경사항 비교)
  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  // 현재 선택된 문서 버전
  const [document, setDocument] = useState<Document | null>(null);
  // 현재 보고 있는 버전의 인덱스 (-1은 최신 버전)
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  // 사이드바 열림/닫힘 상태
  const { open: isSidebarOpen } = useSidebar();

  // 문서 데이터가 로드되면 최신 버전으로 상태 업데이트
  useEffect(() => {
    if (documents && documents.length > 0) {
      const mostRecentDocument = documents.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument); // 현재 문서 설정
        setCurrentVersionIndex(documents.length - 1); // 최신 버전 인덱스 설정
        setArtifact((currentArtifact) => ({
          ...currentArtifact,
          content: mostRecentDocument.content ?? '', // 아티팩트 내용 업데이트
        }));
      }
    }
  }, [documents, setArtifact]);

  // 아티팩트 상태가 변경되면 문서 데이터 새로고침
  useEffect(() => {
    mutateDocuments();
  }, [artifact.status, mutateDocuments]);

  // SWR 전역 mutate 함수 (캐시 업데이트용)
  const { mutate } = useSWRConfig();
  // 내용 변경 중 상태 (저장 중 표시용)
  const [isContentDirty, setIsContentDirty] = useState(false);

  /**
   * 아티팩트 내용 변경 처리 및 서버 저장
   *
   * 작동 방식:
   * 1. 현재 문서와 업데이트된 내용 비교
   * 2. 변경사항이 있으면 서버에 POST 요청으로 저장
   * 3. 로컬 캐시에 새 버전 추가 (낙관적 업데이트)
   * 4. 버전 히스토리에 새 문서 추가
   */
  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!artifact) return;

      // SWR 캐시 업데이트 (낙관적 업데이트)
      mutate<Array<Document>>(
        `/api/document?id=${artifact.documentId}`,
        async (currentDocuments) => {
          if (!currentDocuments) return undefined;

          const currentDocument = currentDocuments.at(-1);

          // 문서가 없거나 내용이 없으면 변경사항 없음
          if (!currentDocument || !currentDocument.content) {
            setIsContentDirty(false);
            return currentDocuments;
          }

          // 내용이 실제로 변경된 경우에만 저장
          if (currentDocument.content !== updatedContent) {
            // 서버에 새 버전 저장
            await fetch(`/api/document?id=${artifact.documentId}`, {
              method: 'POST',
              body: JSON.stringify({
                title: artifact.title,
                content: updatedContent,
                kind: artifact.kind,
              }),
            });

            setIsContentDirty(false);

            // 새 문서 버전 생성
            const newDocument = {
              ...currentDocument,
              content: updatedContent,
              createdAt: new Date(),
            };

            // 문서 히스토리에 새 버전 추가
            return [...currentDocuments, newDocument];
          }
          return currentDocuments;
        },
        { revalidate: false }, // 자동 재검증 비활성화
      );
    },
    [artifact, mutate],
  );

  // 디바운스된 내용 변경 처리 (2초 지연 후 저장)
  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000,
  );

  /**
   * 아티팩트 내용 저장 함수
   *
   * @param updatedContent - 업데이트된 내용
   * @param debounce - 디바운스 사용 여부 (true: 2초 후 저장, false: 즉시 저장)
   */
  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true); // 저장 중 상태 표시

        if (debounce) {
          debouncedHandleContentChange(updatedContent); // 디바운스된 저장
        } else {
          handleContentChange(updatedContent); // 즉시 저장
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange],
  );

  /**
   * 특정 인덱스의 문서 내용 조회
   * 버전 히스토리 탐색 시 사용
   */
  function getDocumentContentById(index: number) {
    if (!documents) return '';
    if (!documents[index]) return '';
    return documents[index].content ?? '';
  }

  /**
   * 문서 버전 네비게이션 처리
   *
   * @param type - 네비게이션 타입
   *   - 'latest': 최신 버전으로 이동
   *   - 'next': 다음 버전으로 이동
   *   - 'prev': 이전 버전으로 이동
   *   - 'toggle': 편집/비교 모드 전환
   */
  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!documents) return;

    if (type === 'latest') {
      setCurrentVersionIndex(documents.length - 1); // 최신 버전 인덱스
      setMode('edit'); // 편집 모드로 전환
    }

    if (type === 'toggle') {
      setMode((mode) => (mode === 'edit' ? 'diff' : 'edit')); // 모드 토글
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1); // 이전 버전
      }
    } else if (type === 'next') {
      if (currentVersionIndex < documents.length - 1) {
        setCurrentVersionIndex((index) => index + 1); // 다음 버전
      }
    }
  };

  // 도구 모음 표시 여부 상태
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);

  /**
   * 현재 버전 여부 판단
   *
   * 조건:
   * - 문서가 없거나 로딩 중이면 현재 버전으로 간주
   * - 현재 인덱스가 최신 버전 인덱스와 같으면 현재 버전
   */
  const isCurrentVersion =
    documents && documents.length > 0
      ? currentVersionIndex === documents.length - 1
      : true;

  // 윈도우 크기 정보 (반응형 레이아웃용)
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth ? windowWidth < 768 : false;

  // 현재 아티팩트 종류에 맞는 정의 찾기
  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!');
  }

  // 아티팩트 초기화 (메타데이터 설정 등)
  useEffect(() => {
    if (artifact.documentId !== 'init') {
      if (artifactDefinition.initialize) {
        artifactDefinition.initialize({
          documentId: artifact.documentId,
          setMetadata,
        });
      }
    }
  }, [artifact.documentId, artifactDefinition, setMetadata]);

  return (
    <AnimatePresence>
      {artifact.isVisible && (
        <motion.div
          data-testid="artifact"
          className="flex flex-row h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.4 } }}
        >
          {/* 데스크톱용 배경 오버레이 */}
          {!isMobile && (
            <motion.div
              className="fixed bg-background h-dvh"
              initial={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
              animate={{ width: windowWidth, right: 0 }}
              exit={{
                width: isSidebarOpen ? windowWidth - 256 : windowWidth,
                right: 0,
              }}
            />
          )}

          {/* 데스크톱용 왼쪽 채팅 패널 */}
          {!isMobile && (
            <motion.div
              className="relative w-[400px] bg-muted dark:bg-background h-dvh shrink-0"
              initial={{ opacity: 0, x: 10, scale: 1 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                  damping: 30,
                },
              }}
              exit={{
                opacity: 0,
                x: 0,
                scale: 1,
                transition: { duration: 0 },
              }}
            >
              {/* 이전 버전 보기 시 오버레이 표시 */}
              <AnimatePresence>
                {!isCurrentVersion && (
                  <motion.div
                    className="left-0 absolute h-dvh w-[400px] top-0 bg-zinc-900/50 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>

              <div className="flex flex-col h-full justify-between items-center">
                {/* 채팅 메시지 영역 */}
                <ArtifactMessages
                  chatId={chatId}
                  status={status}
                  votes={votes}
                  messages={messages}
                  setMessages={setMessages}
                  regenerate={regenerate}
                  isReadonly={isReadonly}
                  artifactStatus={artifact.status}
                />

                {/* 메시지 입력 폼 */}
                <form className="flex flex-row gap-2 relative items-end w-full px-4 pb-4">
                  <MultimodalInput
                    chatId={chatId}
                    input={input}
                    setInput={setInput}
                    status={status}
                    stop={stop}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    messages={messages}
                    sendMessage={sendMessage}
                    className="bg-background dark:bg-muted"
                    setMessages={setMessages}
                    selectedVisibilityType={selectedVisibilityType}
                  />
                </form>
              </div>
            </motion.div>
          )}

          {/* 오른쪽 아티팩트 콘텐츠 패널 */}
          <motion.div
            className="fixed dark:bg-muted bg-background h-dvh flex flex-col overflow-y-scroll md:border-l dark:border-zinc-700 border-zinc-200"
            initial={
              isMobile
                ? {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
                : {
                    opacity: 1,
                    x: artifact.boundingBox.left,
                    y: artifact.boundingBox.top,
                    height: artifact.boundingBox.height,
                    width: artifact.boundingBox.width,
                    borderRadius: 50,
                  }
            }
            animate={
              isMobile
                ? {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth ? windowWidth : 'calc(100dvw)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
                : {
                    opacity: 1,
                    x: 400,
                    y: 0,
                    height: windowHeight,
                    width: windowWidth
                      ? windowWidth - 400
                      : 'calc(100dvw-400px)',
                    borderRadius: 0,
                    transition: {
                      delay: 0,
                      type: 'spring',
                      stiffness: 200,
                      damping: 30,
                      duration: 5000,
                    },
                  }
            }
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: 'spring',
                stiffness: 600,
                damping: 30,
              },
            }}
          >
            {/* 아티팩트 헤더 영역 */}
            <div className="p-2 flex flex-row justify-between items-start">
              <div className="flex flex-row gap-4 items-start">
                {/* 닫기 버튼 */}
                <ArtifactCloseButton />

                {/* 제목 및 업데이트 정보 */}
                <div className="flex flex-col">
                  <div className="font-medium">{artifact.title}</div>

                  {/* 상태에 따른 정보 표시 */}
                  {isContentDirty ? (
                    <div className="text-sm text-muted-foreground">
                      변경사항 저장중....
                    </div>
                  ) : document ? (
                    <div className="text-sm text-muted-foreground">
                      {formatDistance(
                        new Date(document.createdAt),
                        new Date(),
                        {
                          addSuffix: true,
                          locale: ko,
                        },
                      )}{' '}
                      업데이트됨
                    </div>
                  ) : (
                    <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
                  )}
                </div>
              </div>

              {/* 아티팩트 액션 버튼들 (버전 관리, 다운로드 등) */}
              <ArtifactActions
                artifact={artifact}
                currentVersionIndex={currentVersionIndex}
                handleVersionChange={handleVersionChange}
                isCurrentVersion={isCurrentVersion}
                mode={mode}
                metadata={metadata}
                setMetadata={setMetadata}
              />
            </div>

            {/* 아티팩트 메인 콘텐츠 영역 */}
            <div className="dark:bg-muted bg-background h-full overflow-y-scroll !max-w-full items-center">
              {/* 동적 아티팩트 콘텐츠 렌더링 */}
              <artifactDefinition.content
                title={artifact.title}
                content={
                  isCurrentVersion
                    ? artifact.content // 최신 버전: 실시간 내용
                    : getDocumentContentById(currentVersionIndex) // 이전 버전: 저장된 내용
                }
                mode={mode} // 편집/비교 모드
                status={artifact.status} // 스트리밍 상태
                currentVersionIndex={currentVersionIndex}
                suggestions={[]}
                onSaveContent={saveContent} // 내용 저장 콜백
                isInline={false}
                isCurrentVersion={isCurrentVersion}
                getDocumentContentById={getDocumentContentById}
                isLoading={isDocumentsFetching && !artifact.content}
                metadata={metadata}
                setMetadata={setMetadata}
              />

              {/* 현재 버전일 때만 도구 모음 표시 */}
              <AnimatePresence>
                {isCurrentVersion && (
                  <Toolbar
                    isToolbarVisible={isToolbarVisible}
                    setIsToolbarVisible={setIsToolbarVisible}
                    sendMessage={sendMessage}
                    status={status}
                    stop={stop}
                    setMessages={setMessages}
                    artifactKind={artifact.kind}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* 이전 버전 보기 시 버전 네비게이션 푸터 */}
            <AnimatePresence>
              {!isCurrentVersion && (
                <VersionFooter
                  currentVersionIndex={currentVersionIndex}
                  documents={documents}
                  handleVersionChange={handleVersionChange}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 성능 최적화를 위한 메모이제이션 (특정 props 변경 시에만 리렌더링)
export const Artifact = memo(PureArtifact, (prevProps, nextProps) => {
  // 채팅 상태 변경 시 리렌더링
  if (prevProps.status !== nextProps.status) return false;
  // 투표 정보 변경 시 리렌더링
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  // 입력 텍스트 변경 시 리렌더링
  if (prevProps.input !== nextProps.input) return false;
  // 메시지 개수 변경 시 리렌더링
  if (!equal(prevProps.messages, nextProps.messages.length)) return false;
  // 가시성 설정 변경 시 리렌더링
  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
    return false;

  // 위 조건들이 모두 동일하면 리렌더링 하지 않음
  return true;
});
