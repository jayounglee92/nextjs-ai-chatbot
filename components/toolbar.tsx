'use client';
import cx from 'classnames';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import {
  type Dispatch,
  memo,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import { nanoid } from 'nanoid';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ArrowUpIcon, StopIcon, SummarizeIcon } from './icons';
import { artifactDefinitions, type ArtifactKind } from './artifact';
import type { ArtifactToolbarItem } from './create-artifact';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@/lib/types';

/**
 * Tool 컴포넌트의 Props 타입 정의
 */
type ToolProps = {
  /** 툴의 설명 텍스트 (툴팁에 표시) */
  description: string; // 툴의 설명 텍스트 (툴팁에 표시)
  /** 툴의 아이콘 */
  icon: ReactNode;
  /** 현재 선택된 툴의 이름 */
  selectedTool: string | null;
  /** 선택된 툴을 설정하는 함수 */
  setSelectedTool: Dispatch<SetStateAction<string | null>>;
  /** 툴바가 보이는지 여부 (옵션) */
  isToolbarVisible?: boolean;
  /** 툴바 표시 상태를 설정하는 함수 (옵션) */
  setIsToolbarVisible?: Dispatch<SetStateAction<boolean>>;
  /** 애니메이션 진행 중인지 여부 */
  isAnimating: boolean;
  /** 메시지 전송 함수 */
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  /** 툴 클릭 시 실행되는 함수 */
  onClick: ({
    sendMessage,
  }: {
    sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  }) => void;
};

/**
 * 개별 툴 버튼 컴포넌트
 *
 * 이 컴포넌트의 주요 기능:
 * 1. 아티팩트 편집을 위한 개별 툴 버튼 렌더링
 * 2. 툴 선택 상태 관리 및 시각적 피드백
 * 3. 호버 상태 관리 및 툴팁 표시
 * 4. 클릭/키보드 인터랙션 처리
 * 5. 선택 시 아이콘 변경 (일반 아이콘 → 화살표 아이콘)
 *
 * 동작 방식:
 * - 첫 번째 클릭: 툴 선택 (아이콘 변경)
 * - 두 번째 클릭: 툴 실행 (onClick 핸들러 호출)
 * - 다른 툴 클릭: 해당 툴로 선택 변경
 */
const Tool = ({
  description,
  icon,
  selectedTool,
  setSelectedTool,
  isToolbarVisible,
  setIsToolbarVisible,
  isAnimating,
  sendMessage,
  onClick,
}: ToolProps) => {
  // 호버 상태 관리 (툴팁 표시용)
  const [isHovered, setIsHovered] = useState(false);

  // 다른 툴이 선택되면 호버 상태 해제
  useEffect(() => {
    if (selectedTool !== description) {
      setIsHovered(false);
    }
  }, [selectedTool, description]);

  // 툴 선택/실행 핸들러
  const handleSelect = () => {
    // 툴바가 숨겨져 있으면 먼저 표시
    if (!isToolbarVisible && setIsToolbarVisible) {
      setIsToolbarVisible(true);
      return;
    }

    // 아무 툴도 선택되지 않은 경우: 현재 툴 선택
    if (!selectedTool) {
      setIsHovered(true);
      setSelectedTool(description);
      return;
    }

    // 다른 툴이 선택된 경우: 현재 툴로 변경
    if (selectedTool !== description) {
      setSelectedTool(description);
    } else {
      // 현재 툴이 이미 선택된 경우: 툴 실행
      setSelectedTool(null);
      onClick({ sendMessage });
    }
  };

  return (
    // 툴팁 표시 조건: 호버 중이고 애니메이션 중이 아닐 때
    <Tooltip open={isHovered && !isAnimating}>
      <TooltipTrigger asChild>
        <motion.div
          className={cx('p-3 rounded-full', {
            // 선택된 툴은 primary 색상으로 강조
            'bg-primary !text-primary-foreground': selectedTool === description,
          })}
          // 마우스 호버 시작 시 툴팁 표시
          onHoverStart={() => {
            setIsHovered(true);
          }}
          // 마우스 호버 종료 시 툴팁 숨김 (선택된 툴 제외)
          onHoverEnd={() => {
            if (selectedTool !== description) setIsHovered(false);
          }}
          // 키보드 접근성: Enter 키로 툴 선택/실행
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleSelect();
            }
          }}
          // 애니메이션 설정
          initial={{ scale: 1, opacity: 0 }} // 초기: 투명
          animate={{ opacity: 1, transition: { delay: 0.1 } }} // 페이드인
          whileHover={{ scale: 1.1 }} // 호버 시 확대
          whileTap={{ scale: 0.95 }} // 클릭 시 축소
          exit={{
            scale: 0.9,
            opacity: 0,
            transition: { duration: 0.1 },
          }} // 종료 시 축소하며 페이드아웃
          onClick={() => {
            handleSelect();
          }}
        >
          {/* 선택된 툴은 화살표 아이콘, 그렇지 않으면 원래 아이콘 */}
          {selectedTool === description ? <ArrowUpIcon /> : icon}
        </motion.div>
      </TooltipTrigger>
      {/* 툴팁 내용 */}
      <TooltipContent
        side="left"
        sideOffset={16}
        className="bg-foreground text-background rounded-2xl p-3 px-4"
      >
        {description}
      </TooltipContent>
    </Tooltip>
  );
};

// 읽기 수준 선택기의 배경 점들을 위한 랜덤 ID 배열
const randomArr = [...Array(6)].map((x) => nanoid(5));

/**
 * 읽기 수준 선택기 컴포넌트
 *
 * 이 컴포넌트의 주요 기능:
 * 1. 드래그 인터랙션으로 읽기 수준 선택
 * 2. 6단계 읽기 수준 제공 (초등학교 ~ 대학원)
 * 3. 시각적 피드백 (드래그 위치에 따른 레벨 표시)
 * 4. 선택 완료 시 AI에게 읽기 수준 조정 요청 전송
 * 5. 배경 점들과 드래그 가능한 핸들 UI
 *
 * 사용 시나리오:
 * - 사용자가 AI 응답의 난이도를 조정하고 싶을 때
 * - 복잡한 내용을 더 쉽게 설명받고 싶을 때
 * - 전문적인 내용을 더 고급 수준으로 받고 싶을 때
 */
const ReadingLevelSelector = ({
  setSelectedTool,
  sendMessage,
  isAnimating,
}: {
  setSelectedTool: Dispatch<SetStateAction<string | null>>;
  isAnimating: boolean;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
}) => {
  // 6단계 읽기 수준 정의
  const LEVELS = [
    'Elementary', // 0: 초등학교
    'Middle School', // 1: 중학교
    'Keep current level', // 2: 현재 수준 유지 (기본값)
    'High School', // 3: 고등학교
    'College', // 4: 대학교
    'Graduate', // 5: 대학원
  ];

  // 드래그 위치 값 (초기값: 2번째 레벨에 해당하는 위치)
  const y = useMotionValue(-40 * 2);
  // 드래그 제약 조건 (최대 드래그 거리)
  const dragConstraints = 5 * 40 + 2;
  // Y 위치를 레벨 인덱스로 변환하는 트랜스폼
  const yToLevel = useTransform(y, [0, -dragConstraints], [0, 5]);

  // 현재 선택된 레벨 (기본값: 2 = "Keep current level")
  const [currentLevel, setCurrentLevel] = useState(2);
  // 사용자가 레벨을 직접 선택했는지 여부
  const [hasUserSelectedLevel, setHasUserSelectedLevel] =
    useState<boolean>(false);

  // Y 위치 변경 시 현재 레벨 업데이트
  useEffect(() => {
    const unsubscribe = yToLevel.on('change', (latest) => {
      // 0-5 범위로 제한하고 반올림하여 정수 레벨로 변환
      const level = Math.min(5, Math.max(0, Math.round(Math.abs(latest))));
      setCurrentLevel(level);
    });

    return () => unsubscribe();
  }, [yToLevel]);

  return (
    <div className="relative flex flex-col justify-end items-center">
      {/* 배경 점들 렌더링 (6개 레벨을 나타내는 시각적 가이드) */}
      {randomArr.map((id) => (
        <motion.div
          key={id}
          className="size-[40px] flex flex-row items-center justify-center"
          initial={{ opacity: 0 }} // 초기: 투명
          animate={{ opacity: 1 }} // 페이드인
          exit={{ opacity: 0 }} // 종료 시 페이드아웃
          transition={{ delay: 0.1 }}
        >
          {/* 각 레벨을 나타내는 작은 점 */}
          <div className="size-2 rounded-full bg-muted-foreground/40" />
        </motion.div>
      ))}

      <TooltipProvider>
        {/* 애니메이션 중이 아닐 때만 툴팁 표시 */}
        <Tooltip open={!isAnimating}>
          <TooltipTrigger asChild>
            <motion.div
              className={cx(
                'absolute bg-background p-3 border rounded-full flex flex-row items-center',
                {
                  // 기본 레벨(2)이 아니면 primary 색상으로 강조
                  'bg-primary text-primary-foreground': currentLevel !== 2,
                  'bg-background text-foreground': currentLevel === 2,
                },
              )}
              style={{ y }} // 드래그 위치에 따른 Y 좌표
              drag="y" // Y축 드래그만 허용
              dragElastic={0} // 드래그 탄성 효과 제거
              dragMomentum={false} // 드래그 관성 효과 제거
              whileHover={{ scale: 1.05 }} // 호버 시 약간 확대
              whileTap={{ scale: 0.95 }} // 클릭 시 약간 축소
              transition={{ duration: 0.1 }}
              // 드래그 제약: 위쪽으로만 드래그 가능
              dragConstraints={{ top: -dragConstraints, bottom: 0 }}
              onDragStart={() => {
                // 드래그 시작 시 사용자 선택 상태 초기화
                setHasUserSelectedLevel(false);
              }}
              onDragEnd={() => {
                // 드래그 종료 시 레벨에 따른 처리
                if (currentLevel === 2) {
                  // 기본 레벨로 돌아오면 툴 선택 해제
                  setSelectedTool(null);
                } else {
                  // 다른 레벨이면 사용자 선택 상태로 설정
                  setHasUserSelectedLevel(true);
                }
              }}
              onClick={() => {
                // 클릭 시: 기본 레벨이 아니고 사용자가 선택한 경우에만 메시지 전송
                if (currentLevel !== 2 && hasUserSelectedLevel) {
                  sendMessage({
                    role: 'user',
                    parts: [
                      {
                        type: 'text',
                        text: `Please adjust the reading level to ${LEVELS[currentLevel]} level.`,
                      },
                    ],
                  });

                  // 메시지 전송 후 툴 선택 해제
                  setSelectedTool(null);
                }
              }}
            >
              {/* 기본 레벨이면 요약 아이콘, 그렇지 않으면 화살표 아이콘 */}
              {currentLevel === 2 ? <SummarizeIcon /> : <ArrowUpIcon />}
            </motion.div>
          </TooltipTrigger>
          {/* 현재 선택된 레벨을 툴팁으로 표시 */}
          <TooltipContent
            side="left"
            sideOffset={16}
            className="bg-foreground text-background text-sm rounded-2xl p-3 px-4"
          >
            {LEVELS[currentLevel]}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

/**
 * 툴 목록 컴포넌트
 *
 * 이 컴포넌트의 주요 기능:
 * 1. 아티팩트별 사용 가능한 툴들을 렌더링
 * 2. Primary 툴(항상 표시)과 Secondary 툴들(툴바 확장 시 표시) 구분
 * 3. 툴바 표시/숨김 상태에 따른 조건부 렌더링
 * 4. 각 툴의 애니메이션 효과 관리
 * 5. 툴 선택 및 실행 상태 관리
 *
 * 구조:
 * - Primary Tool: 툴바의 메인 버튼 (항상 표시)
 * - Secondary Tools: 툴바 확장 시 나타나는 추가 툴들
 */
export const Tools = ({
  isToolbarVisible,
  selectedTool,
  setSelectedTool,
  sendMessage,
  isAnimating,
  setIsToolbarVisible,
  tools,
}: {
  isToolbarVisible: boolean;
  selectedTool: string | null;
  setSelectedTool: Dispatch<SetStateAction<string | null>>;
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  isAnimating: boolean;
  setIsToolbarVisible: Dispatch<SetStateAction<boolean>>;
  tools: Array<ArtifactToolbarItem>;
}) => {
  // 첫 번째 툴은 Primary, 나머지는 Secondary 툴로 분리
  const [primaryTool, ...secondaryTools] = tools;

  return (
    <motion.div
      className="flex flex-col gap-1.5"
      // 애니메이션 효과
      initial={{ opacity: 0, scale: 0.95 }} // 초기: 투명하고 약간 축소
      animate={{ opacity: 1, scale: 1 }} // 나타날 때: 불투명하고 원래 크기
      exit={{ opacity: 0, scale: 0.95 }} // 사라질 때: 투명하고 약간 축소
    >
      {/* Secondary 툴들: 툴바가 보일 때만 렌더링 */}
      <AnimatePresence>
        {isToolbarVisible &&
          secondaryTools.map((secondaryTool) => (
            <Tool
              key={secondaryTool.description}
              description={secondaryTool.description}
              icon={secondaryTool.icon}
              selectedTool={selectedTool}
              setSelectedTool={setSelectedTool}
              sendMessage={sendMessage}
              isAnimating={isAnimating}
              onClick={secondaryTool.onClick}
            />
          ))}
      </AnimatePresence>

      {/* Primary 툴: 항상 표시되는 메인 버튼 */}
      <Tool
        description={primaryTool.description}
        icon={primaryTool.icon}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        isToolbarVisible={isToolbarVisible}
        setIsToolbarVisible={setIsToolbarVisible}
        sendMessage={sendMessage}
        isAnimating={isAnimating}
        onClick={primaryTool.onClick}
      />
    </motion.div>
  );
};

/**
 * 메인 툴바 컴포넌트 (순수 컴포넌트)
 *
 * 이 컴포넌트의 주요 기능:
 * 1. 아티팩트 편집을 위한 플로팅 툴바 제공
 * 2. 채팅 상태에 따른 동적 UI 변경 (스트리밍 시 정지 버튼)
 * 3. 자동 숨김 타이머 관리 (2초 후 자동 숨김)
 * 4. 외부 클릭 시 툴바 숨김 처리
 * 5. 아티팩트 타입별 맞춤 툴 제공
 * 6. 읽기 수준 조정 기능 (드래그 인터랙션)
 *
 * 표시 조건:
 * - 아티팩트가 활성화되어 있을 때
 * - 스트리밍 중이 아닐 때 (스트리밍 시에는 정지 버튼만 표시)
 *
 * 사용 시나리오:
 * - 사용자가 AI가 생성한 코드/문서를 편집하고 싶을 때
 * - AI 응답의 읽기 수준을 조정하고 싶을 때
 * - 아티팩트에 새로운 기능을 추가하고 싶을 때
 */
const PureToolbar = ({
  isToolbarVisible,
  setIsToolbarVisible,
  sendMessage,
  status,
  stop,
  setMessages,
  artifactKind,
}: {
  isToolbarVisible: boolean;
  setIsToolbarVisible: Dispatch<SetStateAction<boolean>>;
  status: UseChatHelpers<ChatMessage>['status'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  stop: UseChatHelpers<ChatMessage>['stop'];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  artifactKind: ArtifactKind;
}) => {
  // 툴바 DOM 참조 (외부 클릭 감지용)
  const toolbarRef = useRef<HTMLDivElement>(null);
  // 자동 숨김 타이머 참조
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // 현재 선택된 툴 상태
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  // 애니메이션 진행 상태
  const [isAnimating, setIsAnimating] = useState(false);

  // 외부 클릭 시 툴바 숨김 처리
  useOnClickOutside(toolbarRef, () => {
    setIsToolbarVisible(false);
    setSelectedTool(null);
  });

  // 자동 숨김 타이머 시작 (2초 후 숨김)
  const startCloseTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setSelectedTool(null);
      setIsToolbarVisible(false);
    }, 2000);
  };

  // 자동 숨김 타이머 취소
  const cancelCloseTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 스트리밍 중일 때 툴바 자동 숨김
  useEffect(() => {
    if (status === 'streaming') {
      setIsToolbarVisible(false);
    }
  }, [status, setIsToolbarVisible]);

  // 현재 아티팩트 타입에 맞는 툴 정의 찾기
  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifactKind,
  );

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!');
  }

  // 아티팩트 타입별 사용 가능한 툴 목록
  const toolsByArtifactKind = artifactDefinition.toolbar;

  // 사용 가능한 툴이 없으면 렌더링하지 않음
  if (toolsByArtifactKind.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.div
        className="cursor-pointer absolute right-6 bottom-6 p-1.5 border rounded-full shadow-lg bg-background flex flex-col justify-end"
        initial={{ opacity: 0, y: -20, scale: 1 }}
        animate={
          isToolbarVisible
            ? selectedTool === 'adjust-reading-level'
              ? {
                  // 읽기 수준 선택기 활성화 시: 6개 레벨만큼 높이 확장
                  opacity: 1,
                  y: 0,
                  height: 6 * 43,
                  transition: { delay: 0 },
                  scale: 0.95, // 약간 축소하여 드래그 공간 확보
                }
              : {
                  // 일반 툴바 확장 시: 툴 개수만큼 높이 확장
                  opacity: 1,
                  y: 0,
                  height: toolsByArtifactKind.length * 50,
                  transition: { delay: 0 },
                  scale: 1,
                }
            : {
                // 툴바 접힘 상태: 기본 크기
                opacity: 1,
                y: 0,
                height: 54,
                transition: { delay: 0 },
              }
        }
        exit={{ opacity: 0, y: -20, transition: { duration: 0.1 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onHoverStart={() => {
          if (status === 'streaming') return;

          cancelCloseTimer();
          setIsToolbarVisible(true);
        }}
        // 마우스 호버 종료: 자동 숨김 타이머 시작
        onHoverEnd={() => {
          if (status === 'streaming') return;

          startCloseTimer();
        }}
        // 애니메이션 시작/종료 상태 관리
        onAnimationStart={() => {
          setIsAnimating(true);
        }}
        onAnimationComplete={() => {
          setIsAnimating(false);
        }}
        ref={toolbarRef}
      >
        {/* 상태별 조건부 렌더링 */}
        {status === 'streaming' ? (
          // 스트리밍 중: 정지 버튼만 표시
          <motion.div
            key="stop-icon"
            initial={{ scale: 1 }}
            animate={{ scale: 1.4 }} // 강조를 위해 확대
            exit={{ scale: 1 }}
            className="p-3"
            onClick={() => {
              stop(); // 스트리밍 정지
              setMessages((messages) => messages); // 메시지 상태 유지
            }}
          >
            <StopIcon />
          </motion.div>
        ) : selectedTool === 'adjust-reading-level' ? (
          // 읽기 수준 조정 모드: 드래그 선택기 표시
          <ReadingLevelSelector
            key="reading-level-selector"
            sendMessage={sendMessage}
            setSelectedTool={setSelectedTool}
            isAnimating={isAnimating}
          />
        ) : (
          // 일반 모드: 아티팩트 편집 툴들 표시
          <Tools
            key="tools"
            sendMessage={sendMessage}
            isAnimating={isAnimating}
            isToolbarVisible={isToolbarVisible}
            selectedTool={selectedTool}
            setIsToolbarVisible={setIsToolbarVisible}
            setSelectedTool={setSelectedTool}
            tools={toolsByArtifactKind}
          />
        )}
      </motion.div>
    </TooltipProvider>
  );
};

/**
 * 메모이제이션된 Toolbar 컴포넌트
 *
 * 성능 최적화를 위한 React.memo 적용:
 * - status 변경 시 리렌더링 (스트리밍 상태 변화 반영)
 * - isToolbarVisible 변경 시 리렌더링 (툴바 표시/숨김 상태 반영)
 * - artifactKind 변경 시 리렌더링 (아티팩트 타입별 툴 변경 반영)
 * - 기타 props 변경 시에는 리렌더링하지 않음
 *
 * 최적화 효과:
 * - 채팅 메시지가 업데이트되어도 툴바는 불필요하게 리렌더링되지 않음
 * - 아티팩트와 관련 없는 상태 변경 시 성능 향상
 * - 복잡한 애니메이션과 인터랙션이 많은 툴바의 성능 최적화
 */
export const Toolbar = memo(PureToolbar, (prevProps, nextProps) => {
  // 채팅 상태 변경 시 리렌더링 (스트리밍/정지 버튼 전환)
  if (prevProps.status !== nextProps.status) return false;

  // 툴바 표시 상태 변경 시 리렌더링
  if (prevProps.isToolbarVisible !== nextProps.isToolbarVisible) return false;

  // 아티팩트 타입 변경 시 리렌더링 (사용 가능한 툴 목록 변경)
  if (prevProps.artifactKind !== nextProps.artifactKind) return false;

  // 위 조건들이 모두 변경되지 않았으면 리렌더링하지 않음
  return true;
});
