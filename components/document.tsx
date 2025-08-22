import { memo } from 'react';

import type { ArtifactKind } from './artifact';
import { FileIcon, LoaderIcon, MessageIcon, PencilEditIcon } from './icons';
import { toast } from 'sonner';
import { useArtifact } from '@/hooks/use-artifact';

/**
 * 도구 작업 타입에 따른 텍스트를 반환하는 헬퍼 함수
 *
 * @param type - 작업 타입 ('create', 'update', 'request-suggestions')
 * @param tense - 시제 ('present': 현재진행, 'past': 과거완료)
 * @returns 해당하는 동작 텍스트
 */
const getActionText = (
  type: 'create' | 'update' | 'request-suggestions',
  tense: 'present' | 'past',
) => {
  switch (type) {
    case 'create':
      return tense === 'present' ? 'Creating' : 'Created';
    case 'update':
      return tense === 'present' ? 'Updating' : 'Updated';
    case 'request-suggestions':
      return tense === 'present'
        ? 'Adding suggestions'
        : 'Added suggestions to';
    default:
      return null;
  }
};

/**
 * 도구 실행 완료 결과를 표시하는 컴포넌트의 Props
 */
interface DocumentToolResultProps {
  type: 'create' | 'update' | 'request-suggestions'; // 수행된 작업 타입
  result: { id: string; title: string; kind: ArtifactKind }; // 생성된 문서 정보
  isReadonly: boolean; // 읽기 전용 모드 여부
}

/**
 * AI가 도구 실행을 완료한 후 표시되는 결과 컴포넌트
 *
 * 기능:
 * - AI가 문서를 생성/수정/제안 추가를 완료했을 때 표시
 * - 클릭하면 해당 아티팩트를 사이드 패널에서 열어볼 수 있음
 * - 작업 타입에 따라 다른 아이콘과 텍스트 표시
 *
 * 사용 예시:
 * - "Created 'React 컴포넌트 예제'" (파일 생성 완료)
 * - "Updated '코드 최적화'" (파일 수정 완료)
 * - "Added suggestions to 문서" (제안 추가 완료)
 */
function PureDocumentToolResult({
  type,
  result,
  isReadonly,
}: DocumentToolResultProps) {
  const { setArtifact } = useArtifact(); // 아티팩트 상태 관리 훅

  return (
    <button
      type="button"
      className="bg-background cursor-pointer border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start"
      onClick={(event) => {
        // 읽기 전용 모드에서는 아티팩트 열기 불가
        if (isReadonly) {
          toast.error('공유된 채팅에서 파일을 볼 수 없습니다.');
          return;
        }

        // 클릭된 버튼의 위치 정보 가져오기 (애니메이션 효과용)
        const rect = event.currentTarget.getBoundingClientRect();

        // 아티팩트 패널이 나타날 위치 설정
        const boundingBox = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        // 아티팩트 상태 업데이트 (사이드 패널에서 열림)
        setArtifact({
          documentId: result.id, // 문서 ID
          kind: result.kind, // 문서 타입 (code, text, etc.)
          content: '', // 내용은 나중에 로드
          title: result.title, // 문서 제목
          isVisible: true, // 패널 표시
          status: 'idle', // 준비 상태
          boundingBox, // 애니메이션 시작 위치
        });
      }}
    >
      {/* 작업 타입에 따른 아이콘 표시 */}
      <div className="text-muted-foreground mt-1">
        {type === 'create' ? (
          <FileIcon /> // 파일 생성 아이콘
        ) : type === 'update' ? (
          <PencilEditIcon /> // 편집 아이콘
        ) : type === 'request-suggestions' ? (
          <MessageIcon /> // 메시지 아이콘
        ) : null}
      </div>

      {/* 완료된 작업과 문서 제목 표시 */}
      <div className="text-left">
        {`${getActionText(type, 'past')} "${result.title}"`}
      </div>
    </button>
  );
}

// 성능 최적화를 위한 메모이제이션 (항상 같은 결과 반환하므로 재렌더링 방지)
export const DocumentToolResult = memo(PureDocumentToolResult, () => true);

/**
 * 도구 실행 중 상태를 표시하는 컴포넌트의 Props
 */
interface DocumentToolCallProps {
  type: 'create' | 'update' | 'request-suggestions'; // 실행 중인 작업 타입
  args:
    | { title: string; kind: ArtifactKind } // 생성 작업용 인수
    | { id: string; description: string } // 수정 작업용 인수
    | { documentId: string }; // 제안 요청용 인수
  isReadonly: boolean; // 읽기 전용 모드 여부
}

/**
 * AI가 도구를 실행하는 중일 때 표시되는 로딩 컴포넌트
 *
 * 기능:
 * - AI가 문서 생성/수정/제안 추가 작업을 진행 중일 때 표시
 * - 로딩 스피너와 함께 현재 진행 중인 작업 정보 표시
 * - 클릭하면 아티팩트 패널을 미리 열어서 작업 진행상황 확인 가능
 *
 * 사용 예시:
 * - "Creating 'React 컴포넌트 예제'..." (생성 중)
 * - "Updating '코드 최적화'..." (수정 중)
 * - "Adding suggestions for document..." (제안 추가 중)
 */
function PureDocumentToolCall({
  type,
  args,
  isReadonly,
}: DocumentToolCallProps) {
  const { setArtifact } = useArtifact(); // 아티팩트 상태 관리 훅

  return (
    <button
      type="button"
      className="cursor pointer w-fit border py-2 px-3 rounded-xl flex flex-row items-start justify-between gap-3"
      onClick={(event) => {
        // 읽기 전용 모드에서는 아티팩트 열기 불가
        if (isReadonly) {
          toast.error(
            'Viewing files in shared chats is currently not supported.',
          );
          return;
        }

        // 클릭된 버튼의 위치 정보 가져오기 (애니메이션 효과용)
        const rect = event.currentTarget.getBoundingClientRect();

        // 아티팩트 패널이 나타날 위치 설정
        const boundingBox = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        // 현재 아티팩트 상태를 유지하면서 패널만 표시
        setArtifact((currentArtifact) => ({
          ...currentArtifact, // 기존 상태 유지
          isVisible: true, // 패널 표시
          boundingBox, // 애니메이션 시작 위치
        }));
      }}
    >
      <div className="flex flex-row gap-3 items-start">
        {/* 작업 타입에 따른 아이콘 표시 */}
        <div className="text-zinc-500 mt-1">
          {type === 'create' ? (
            <FileIcon /> // 파일 생성 아이콘
          ) : type === 'update' ? (
            <PencilEditIcon /> // 편집 아이콘
          ) : type === 'request-suggestions' ? (
            <MessageIcon /> // 메시지 아이콘
          ) : null}
        </div>

        {/* 진행 중인 작업과 대상 정보 표시 */}
        <div className="text-left">
          {`${getActionText(type, 'present')} ${
            type === 'create' && 'title' in args && args.title
              ? `"${args.title}"` // 생성: 제목 표시
              : type === 'update' && 'description' in args
                ? `"${args.description}"` // 수정: 설명 표시
                : type === 'request-suggestions'
                  ? 'for document' // 제안: 고정 텍스트
                  : ''
          }`}
        </div>
      </div>

      {/* 로딩 스피너 */}
      <div className="animate-spin mt-1">{<LoaderIcon />}</div>
    </button>
  );
}

// 성능 최적화를 위한 메모이제이션 (항상 같은 결과 반환하므로 재렌더링 방지)
export const DocumentToolCall = memo(PureDocumentToolCall, () => true);
