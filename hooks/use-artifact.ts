'use client';

import useSWR from 'swr';
import type { UIArtifact } from '@/components/artifact';
import { useCallback, useMemo } from 'react';

/**
 * 아티팩트의 초기 상태 데이터
 *
 * 아티팩트가 생성되기 전 또는 초기화 시 사용되는 기본값들
 * - documentId: 초기 식별자
 * - content: 빈 콘텐츠로 시작
 * - kind: 기본 타입은 'text'
 * - status: 'idle' 상태로 시작 (비활성)
 * - isVisible: 처음에는 숨김 상태
 * - boundingBox: 화면 좌표 초기화
 */
export const initialArtifactData: UIArtifact = {
  documentId: 'init',
  content: '',
  kind: 'text',
  title: '',
  status: 'idle',
  isVisible: false,
  boundingBox: {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
};

// 아티팩트 상태에서 특정 값을 선택하는 함수 타입
type Selector<T> = (state: UIArtifact) => T;

/**
 * 아티팩트 상태의 특정 부분만 선택적으로 구독하는 훅
 *
 * Redux의 useSelector와 유사한 패턴으로, 아티팩트 상태에서
 * 필요한 부분만 선택하여 구독할 수 있습니다.
 *
 * 사용 예시:
 * ```typescript
 * const isVisible = useArtifactSelector(state => state.isVisible);
 * const title = useArtifactSelector(state => state.title);
 * ```
 *
 * 장점:
 * - 필요한 데이터만 구독하여 불필요한 리렌더링 방지
 * - 컴포넌트별로 관심사 분리 가능
 * - 타입 안전성 보장
 *
 * @param selector 아티팩트 상태에서 원하는 값을 추출하는 함수
 * @returns 선택된 값
 */
export function useArtifactSelector<Selected>(selector: Selector<Selected>) {
  // SWR로 아티팩트 상태를 로컬 캐시에서 가져오기
  const { data: localArtifact } = useSWR<UIArtifact>('artifact', null, {
    fallbackData: initialArtifactData,
  });

  // selector 함수를 통해 필요한 값만 추출 (메모이제이션)
  const selectedValue = useMemo(() => {
    if (!localArtifact) return selector(initialArtifactData);
    return selector(localArtifact);
  }, [localArtifact, selector]);

  return selectedValue;
}

/**
 * 아티팩트 상태와 메타데이터를 관리하는 메인 훅
 *
 * 이 훅의 주요 역할:
 * 1. 아티팩트 상태 관리 (내용, 타입, 가시성 등)
 * 2. 아티팩트 업데이트 함수 제공
 * 3. 아티팩트별 메타데이터 관리
 * 4. SWR을 통한 로컬 캐시 활용
 *
 * 아티팩트란?
 * - AI가 생성한 코드, 이미지, 문서, 스프레드시트 등의 결과물
 * - 채팅과 별도로 표시되는 인터랙티브한 콘텐츠
 * - 실시간 편집, 다운로드, 공유 등이 가능한 객체
 *
 * 사용 예시:
 * ```typescript
 * const { artifact, setArtifact, metadata, setMetadata } = useArtifact();
 *
 * // 아티팩트 내용 업데이트
 * setArtifact(prev => ({ ...prev, content: newCode }));
 *
 * // 아티팩트 표시/숨김
 * setArtifact(prev => ({ ...prev, isVisible: true }));
 * ```
 */
export function useArtifact() {
  // 아티팩트 메인 상태 관리
  const { data: localArtifact, mutate: setLocalArtifact } = useSWR<UIArtifact>(
    'artifact', // 전역 캐시 키
    null, // fetcher 없음 (로컬 상태만 관리)
    {
      fallbackData: initialArtifactData, // 초기값
    },
  );

  // 현재 아티팩트 상태 (null 체크 포함)
  const artifact = useMemo(() => {
    if (!localArtifact) return initialArtifactData;
    return localArtifact;
  }, [localArtifact]);

  // 아티팩트 업데이트 함수 (함수형 업데이트 지원)
  const setArtifact = useCallback(
    (updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)) => {
      setLocalArtifact((currentArtifact) => {
        // 현재 상태가 없으면 초기값 사용
        const artifactToUpdate = currentArtifact || initialArtifactData;

        // 함수형 업데이트인 경우
        if (typeof updaterFn === 'function') {
          return updaterFn(artifactToUpdate);
        }

        // 직접 값 설정인 경우
        return updaterFn;
      });
    },
    [setLocalArtifact],
  );

  // 아티팩트별 메타데이터 관리 (동적 키 생성)
  const { data: localArtifactMetadata, mutate: setLocalArtifactMetadata } =
    useSWR<any>(
      // documentId가 있을 때만 메타데이터 캐시 키 생성
      () =>
        artifact.documentId ? `artifact-metadata-${artifact.documentId}` : null,
      null,
      {
        fallbackData: null,
      },
    );

  // 모든 아티팩트 관련 상태와 함수들을 하나의 객체로 반환
  return useMemo(
    () => ({
      artifact, // 현재 아티팩트 상태
      setArtifact, // 아티팩트 업데이트 함수
      metadata: localArtifactMetadata, // 아티팩트 메타데이터
      setMetadata: setLocalArtifactMetadata, // 메타데이터 업데이트 함수
    }),
    [artifact, setArtifact, localArtifactMetadata, setLocalArtifactMetadata],
  );
}
