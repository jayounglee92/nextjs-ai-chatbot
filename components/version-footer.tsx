'use client';

import { isAfter } from 'date-fns';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';

import type { Document } from '@/lib/db/schema';
import { getDocumentTimestampByIndex } from '@/lib/utils';

import { LoaderIcon } from './icons';
import { Button } from './ui/button';
import { useArtifact } from '@/hooks/use-artifact';

/**
 * VersionFooter 컴포넌트의 Props 타입 정의
 */
interface VersionFooterProps {
  /** 버전 변경 핸들러 함수 (이전/다음/토글/최신 버전으로 이동) */
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  /** 문서의 모든 버전 배열 (시간순으로 정렬) */
  documents: Array<Document> | undefined;
  /** 현재 보고 있는 버전의 인덱스 */
  currentVersionIndex: number;
}

/**
 * 문서 버전 관리 푸터 컴포넌트
 *
 * 이 컴포넌트의 주요 기능:
 * 1. 이전 버전을 보고 있을 때 하단에 나타나는 알림 바
 * 2. 이전 버전으로 되돌리기 기능 (DELETE API 호출)
 * 3. 최신 버전으로 돌아가기 기능
 * 4. 낙관적 업데이트를 통한 즉시 UI 반영
 * 5. 모바일/데스크톱 반응형 애니메이션
 *
 * 표시 조건:
 * - 사용자가 최신 버전이 아닌 이전 버전을 보고 있을 때
 * - 문서에 여러 버전이 존재할 때
 *
 * 사용 시나리오:
 * - AI가 문서를 수정했는데 이전 버전이 더 좋다고 판단될 때
 * - 실수로 잘못 편집된 내용을 되돌리고 싶을 때
 * - 문서의 변경 이력을 확인하다가 특정 버전으로 되돌리고 싶을 때
 */
export const VersionFooter = ({
  handleVersionChange,
  documents,
  currentVersionIndex,
}: VersionFooterProps) => {
  // 현재 아티팩트 정보 (문서 ID 등)
  const { artifact } = useArtifact();

  // 화면 크기 감지 (모바일/데스크톱 구분)
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // SWR 캐시 조작을 위한 mutate 함수
  const { mutate } = useSWRConfig();
  // 되돌리기 버튼 로딩 상태 관리
  const [isMutating, setIsMutating] = useState(false);

  // 문서가 없으면 렌더링하지 않음
  if (!documents) return;

  return (
    <motion.div
      className="absolute bottom-0 z-50 flex w-full flex-col justify-between gap-4 border-t bg-background p-4 lg:flex-row"
      initial={{ y: isMobile ? 200 : 77 }}
      animate={{ y: 0 }}
      exit={{ y: isMobile ? 200 : 77 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20 }}
    >
      {/* 알림 메시지 영역 */}
      <div>
        <div>이전 버전을 보고 있습니다</div>
        <div className="text-sm text-muted-foreground">
          이전 버전으로 되돌려 수정할 수 있습니다
        </div>
      </div>

      {/* 액션 버튼 영역 */}
      <div className="flex flex-row gap-4">
        {/* 이전 버전으로 되돌리기 버튼 */}
        <Button
          disabled={isMutating} // 처리 중일 때 비활성화
          onClick={async () => {
            // 로딩 상태 시작
            setIsMutating(true);

            // SWR 캐시 업데이트 + DELETE API 호출
            mutate(
              // 캐시 키: 현재 문서의 SWR 키
              `/api/document?id=${artifact.documentId}`,
              // API 호출: 현재 버전 이후의 모든 버전 삭제
              await fetch(
                `/api/document?id=${artifact.documentId}&timestamp=${getDocumentTimestampByIndex(
                  documents,
                  currentVersionIndex,
                )}`,
                {
                  method: 'DELETE', // DELETE 요청
                },
              ),
              {
                // 낙관적 업데이트: 즉시 UI에 반영할 데이터
                optimisticData: documents
                  ? [
                      // 현재 버전 이후에 생성된 문서들만 필터링 (삭제될 문서들 제외)
                      ...documents.filter((document) =>
                        isAfter(
                          new Date(document.createdAt), // 문서 생성 시간
                          new Date(
                            getDocumentTimestampByIndex(
                              documents,
                              currentVersionIndex, // 현재 보고 있는 버전의 시간
                            ),
                          ),
                        ),
                      ),
                    ]
                  : [],
              },
            );
          }}
        >
          <div>이전 버전으로 되돌리기</div>
          {/* 로딩 중일 때 스피너 표시 */}
          {isMutating && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
        </Button>

        {/* 최신 버전으로 돌아가기 버튼 */}
        <Button
          variant="outline"
          onClick={() => {
            // 부모 컴포넌트의 버전 변경 핸들러 호출 (최신 버전으로)
            handleVersionChange('latest');
          }}
        >
          최신 버전으로 돌아가기
        </Button>
      </div>
    </motion.div>
  );
};
