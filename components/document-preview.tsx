'use client';

import {
  memo,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { ArtifactKind, UIArtifact } from './artifact';
import { FileIcon, FullscreenIcon, ImageIcon, LoaderIcon } from './icons';
import { cn, fetcher } from '@/lib/utils';
import type { Document } from '@/lib/db/schema';
import { InlineDocumentSkeleton } from './document-skeleton';
import useSWR from 'swr';
import { Editor } from './text-editor';
import { DocumentToolCall, DocumentToolResult } from './document';
import { CodeEditor } from './code-editor';
import { useArtifact } from '@/hooks/use-artifact';
import equal from 'fast-deep-equal';
import { SpreadsheetEditor } from './sheet-editor';
import { ImageEditor } from './image-editor';

/**
 * DocumentPreview 컴포넌트의 Props 인터페이스
 */
interface DocumentPreviewProps {
  isReadonly: boolean; // 읽기 전용 모드 여부
  result?: any; // 도구 실행 완료 후 결과 데이터 (output-available 상태)
  args?: any; // 도구 실행 전 입력 데이터 (input-available 상태)
}

/**
 * 문서 미리보기 컴포넌트
 *
 * 이 컴포넌트의 주요 기능:
 * 1. AI가 생성한 문서(텍스트, 코드, 이미지, 스프레드시트)의 미리보기 제공
 * 2. 도구 호출 상태에 따른 다양한 렌더링 (args vs result)
 * 3. 클릭 시 아티팩트 전체화면 모드로 전환
 * 4. 실시간 스트리밍 중인 문서 내용 표시
 * 5. 문서 타입별 적절한 에디터 선택 및 렌더링
 *
 * 사용 시나리오:
 * - AI가 "React 컴포넌트를 만들어줘"라고 요청받았을 때
 * - 도구 호출 input-available: args로 생성 예정 문서 정보 표시
 * - 도구 호출 output-available: result로 실제 생성된 문서 표시
 */
export function DocumentPreview({
  isReadonly,
  result,
  args,
}: DocumentPreviewProps) {
  // 아티팩트 상태 관리 (전체화면 표시, 위치 정보 등)
  const { artifact, setArtifact } = useArtifact();

  // 서버에서 문서 데이터 조회 (result가 있을 때만)
  const { data: documents, isLoading: isDocumentsFetching } = useSWR<
    Array<Document>
  >(result ? `/api/document?id=${result.id}` : null, fetcher);

  // 조회된 문서 중 첫 번째 문서 선택
  const previewDocument = useMemo(() => documents?.[0], [documents]);

  // 클릭 영역 DOM 참조 (전체화면 전환 시 위치 계산용)
  const hitboxRef = useRef<HTMLDivElement>(null);

  // 아티팩트의 화면상 위치 정보 업데이트
  useEffect(() => {
    const boundingBox = hitboxRef.current?.getBoundingClientRect();

    if (artifact.documentId && boundingBox) {
      setArtifact((artifact) => ({
        ...artifact,
        boundingBox: {
          left: boundingBox.x, // 화면상 X 좌표
          top: boundingBox.y, // 화면상 Y 좌표
          width: boundingBox.width, // 너비
          height: boundingBox.height, // 높이
        },
      }));
    }
  }, [artifact.documentId, setArtifact]);

  // 아티팩트가 전체화면 모드인 경우 전용 컴포넌트 렌더링
  if (artifact.isVisible) {
    // 도구 실행 완료 상태 (output-available)
    if (result) {
      return (
        <DocumentToolResult
          type="create"
          result={{ id: result.id, title: result.title, kind: result.kind }}
          isReadonly={isReadonly}
        />
      );
    }

    // 도구 실행 준비 상태 (input-available)
    if (args) {
      return (
        <DocumentToolCall
          type="create"
          args={{ title: args.title, kind: args.kind }}
          isReadonly={isReadonly}
        />
      );
    }
  }

  // 문서 데이터 로딩 중일 때 스켈레톤 표시
  if (isDocumentsFetching) {
    return <LoadingSkeleton artifactKind={result.kind ?? args.kind} />;
  }

  // 표시할 문서 결정 (우선순위: 서버 데이터 > 스트리밍 데이터 > null)
  const document: Document | null = previewDocument
    ? previewDocument // 서버에서 조회된 완성된 문서
    : artifact.status === 'streaming'
      ? {
          // 실시간 스트리밍 중인 문서 (임시 객체 생성)
          title: artifact.title,
          kind: artifact.kind,
          content: artifact.content,
          id: artifact.documentId,
          createdAt: new Date(),
          userId: 'noop', // 임시값
        }
      : null; // 문서 없음

  // 문서가 없으면 스켈레톤 표시
  if (!document) return <LoadingSkeleton artifactKind={artifact.kind} />;

  return (
    <div className="relative w-full cursor-pointer">
      {/* 투명한 클릭 영역 (전체화면 전환용) */}
      <HitboxLayer
        hitboxRef={hitboxRef}
        result={result}
        setArtifact={setArtifact}
      />

      {/* 문서 헤더 (제목, 아이콘, 로딩 상태) */}
      <DocumentHeader
        title={document.title}
        kind={document.kind}
        isStreaming={artifact.status === 'streaming'}
      />

      {/* 문서 내용 (타입별 에디터) */}
      <DocumentContent document={document} />
    </div>
  );
}

/**
 * 로딩 중일 때 표시되는 스켈레톤 컴포넌트
 *
 * 문서 타입에 따라 다른 스켈레톤을 표시:
 * - 이미지: 고정 높이의 회색 박스
 * - 텍스트/코드: InlineDocumentSkeleton으로 텍스트 라인 모방
 */
const LoadingSkeleton = ({ artifactKind }: { artifactKind: ArtifactKind }) => (
  <div className="w-full">
    {/* 헤더 스켈레톤 (아이콘 + 제목) */}
    <div className="flex h-[57px] flex-row items-center justify-between gap-2 rounded-t-2xl border border-b-0 p-4 dark:border-zinc-700 dark:bg-muted">
      <div className="flex flex-row items-center gap-3">
        <div className="text-muted-foreground">
          {/* 아이콘 자리 애니메이션 박스 */}
          <div className="size-4 animate-pulse rounded-md bg-muted-foreground/20" />
        </div>
        {/* 제목 자리 애니메이션 박스 */}
        <div className="h-4 w-24 animate-pulse rounded-lg bg-muted-foreground/20" />
      </div>
      <div>
        <FullscreenIcon />
      </div>
    </div>

    {/* 콘텐츠 스켈레톤 (타입별 구분) */}
    {artifactKind === 'image' ? (
      // 이미지 타입: 고정 높이 박스
      <div className="overflow-y-scroll rounded-b-2xl border border-t-0 bg-muted dark:border-zinc-700">
        <div className="h-[257px] w-full animate-pulse bg-muted-foreground/20" />
      </div>
    ) : (
      // 텍스트/코드 타입: 라인 형태 스켈레톤
      <div className="overflow-y-scroll rounded-b-2xl border border-t-0 bg-muted p-8 pt-4 dark:border-zinc-700">
        <InlineDocumentSkeleton />
      </div>
    )}
  </div>
);

/**
 * 투명한 클릭 영역 컴포넌트 (순수 컴포넌트)
 *
 * 역할:
 * 1. 문서 미리보기 전체를 덮는 투명한 클릭 영역 제공
 * 2. 클릭 시 아티팩트를 전체화면 모드로 전환
 * 3. 클릭 위치 정보를 저장하여 애니메이션 효과 지원
 * 4. 우측 상단에 전체화면 아이콘 표시
 */
const PureHitboxLayer = ({
  hitboxRef,
  result,
  setArtifact,
}: {
  hitboxRef: React.RefObject<HTMLDivElement>; // 클릭 영역 DOM 참조
  result: any; // 도구 실행 결과 (문서 정보)
  setArtifact: (
    updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact),
  ) => void; // 아티팩트 상태 업데이트 함수
}) => {
  // 클릭 이벤트 처리 함수
  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      // 클릭된 요소의 화면상 위치 정보 계산
      const boundingBox = event.currentTarget.getBoundingClientRect();

      setArtifact((artifact) =>
        artifact.status === 'streaming'
          ? // 스트리밍 중인 경우: 현재 상태 유지하고 전체화면만 활성화
            { ...artifact, isVisible: true }
          : // 완성된 문서인 경우: 결과 데이터로 아티팩트 정보 업데이트
            {
              ...artifact,
              title: result.title,
              documentId: result.id,
              kind: result.kind,
              isVisible: true, // 전체화면 모드 활성화
              boundingBox: {
                // 애니메이션을 위한 시작 위치 저장
                left: boundingBox.x,
                top: boundingBox.y,
                width: boundingBox.width,
                height: boundingBox.height,
              },
            },
      );
    },
    [setArtifact, result],
  );

  return (
    <div
      className="absolute left-0 top-0 z-10 size-full rounded-xl" // 전체 영역을 덮는 투명한 레이어
      ref={hitboxRef}
      onClick={handleClick}
      role="presentation" // 접근성: 장식적 요소임을 표시
      aria-hidden="true" // 스크린 리더에서 숨김
    >
      <div className="flex w-full items-center justify-end p-4">
        {/* 우측 상단 전체화면 아이콘 (호버 효과 포함) */}
        <div className="absolute right-[9px] top-[13px] rounded-md p-2 hover:bg-zinc-100 hover:dark:bg-zinc-700">
          <FullscreenIcon />
        </div>
      </div>
    </div>
  );
};

/**
 * 메모이제이션된 HitboxLayer 컴포넌트
 *
 * 최적화: result 데이터가 변경될 때만 리렌더링
 * - 같은 문서에 대해서는 불필요한 리렌더링 방지
 * - 클릭 이벤트 핸들러 재생성 최소화
 */
const HitboxLayer = memo(PureHitboxLayer, (prevProps, nextProps) => {
  if (!equal(prevProps.result, nextProps.result)) return false;
  return true;
});

/**
 * 문서 헤더 컴포넌트 (순수 컴포넌트)
 *
 * 표시 내용:
 * 1. 문서 타입별 아이콘 (이미지/파일/로딩)
 * 2. 문서 제목
 * 3. 스트리밍 상태 표시 (회전하는 로더)
 */
const PureDocumentHeader = ({
  title,
  kind,
  isStreaming,
}: {
  title: string; // 문서 제목
  kind: ArtifactKind; // 문서 타입 (text, code, image, sheet)
  isStreaming: boolean; // 스트리밍 중 여부
}) => (
  <div className="flex flex-row items-start justify-between gap-2 rounded-t-2xl border border-b-0 p-4 dark:border-zinc-700 dark:bg-muted sm:items-center">
    <div className="flex flex-row items-start gap-3 sm:items-center">
      {/* 상태별 아이콘 표시 */}
      <div className="text-muted-foreground">
        {isStreaming ? (
          // 스트리밍 중: 회전하는 로딩 아이콘
          <div className="animate-spin">
            <LoaderIcon />
          </div>
        ) : kind === 'image' ? (
          // 이미지 타입: 이미지 아이콘
          <ImageIcon />
        ) : (
          // 기타 타입: 파일 아이콘
          <FileIcon />
        )}
      </div>
      {/* 문서 제목 (반응형 위치 조정) */}
      <div className="-translate-y-1 font-medium sm:translate-y-0">{title}</div>
    </div>
    {/* 우측 여백 (전체화면 아이콘 공간 확보) */}
    <div className="w-8" />
  </div>
);

/**
 * 메모이제이션된 DocumentHeader 컴포넌트
 *
 * 최적화: 제목이나 스트리밍 상태가 변경될 때만 리렌더링
 */
const DocumentHeader = memo(PureDocumentHeader, (prevProps, nextProps) => {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;

  return true;
});

/**
 * 문서 내용을 렌더링하는 컴포넌트
 *
 * 문서 타입별로 적절한 에디터를 선택하여 렌더링:
 * - text: 일반 텍스트 에디터 (마크다운 지원)
 * - code: 코드 에디터 (구문 하이라이팅)
 * - sheet: 스프레드시트 에디터 (표 형태)
 * - image: 이미지 에디터 (이미지 표시 및 편집)
 */
const DocumentContent = ({ document }: { document: Document }) => {
  const { artifact } = useArtifact();

  // 문서 타입별 컨테이너 스타일 설정
  const containerClassName = cn(
    'h-[257px] overflow-y-scroll rounded-b-2xl border border-t-0 dark:border-zinc-700 dark:bg-muted',
    {
      'p-4 sm:px-14 sm:py-16': document.kind === 'text', // 텍스트: 넉넉한 패딩
      'p-0': document.kind === 'code', // 코드: 패딩 없음 (에디터 자체 스타일 사용)
    },
  );

  // 모든 에디터에 공통으로 전달할 props
  const commonProps = {
    content: document.content ?? '', // 문서 내용
    isCurrentVersion: true, // 현재 버전 여부
    currentVersionIndex: 0, // 현재 버전 인덱스
    status: artifact.status, // 아티팩트 상태 (streaming/idle)
    saveContent: () => {}, // 저장 함수 (미리보기에서는 빈 함수)
    suggestions: [], // 제안사항 (미리보기에서는 빈 배열)
  };

  return (
    <div className={containerClassName}>
      {/* 문서 타입별 에디터 렌더링 */}
      {document.kind === 'text' ? (
        // 텍스트 문서: 일반 텍스트 에디터
        <Editor {...commonProps} onSaveContent={() => {}} />
      ) : document.kind === 'code' ? (
        // 코드 문서: 코드 에디터 (구문 하이라이팅 지원)
        <div className="relative flex w-full flex-1">
          <div className="absolute inset-0">
            <CodeEditor {...commonProps} onSaveContent={() => {}} />
          </div>
        </div>
      ) : document.kind === 'sheet' ? (
        // 스프레드시트 문서: 표 형태 에디터
        <div className="relative flex size-full flex-1 p-4">
          <div className="absolute inset-0">
            <SpreadsheetEditor {...commonProps} />
          </div>
        </div>
      ) : document.kind === 'image' ? (
        // 이미지 문서: 이미지 뷰어/에디터
        <ImageEditor
          title={document.title}
          content={document.content ?? ''}
          isCurrentVersion={true}
          currentVersionIndex={0}
          status={artifact.status}
          isInline={true} // 인라인 모드 (미리보기용)
        />
      ) : null}
    </div>
  );
};
