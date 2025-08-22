'use server';

import { generateText, type UIMessage } from 'ai';
import { cookies } from 'next/headers';
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

/**
 * 사용자가 선택한 채팅 모델을 브라우저 쿠키에 저장
 *
 * 용도:
 * - 사용자가 모델을 변경할 때 선택 상태를 유지
 * - 페이지 새로고침 후에도 마지막 선택한 모델 기억
 * - 세션 간 모델 선택 지속성 제공
 *
 * @param model - 저장할 모델 ID (예: 'chat-model', 'chat-model-mini')
 */
export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

/**
 * 사용자의 첫 번째 메시지를 기반으로 채팅방 제목을 자동 생성
 *
 * 작동 방식:
 * 1. 사용자가 새 채팅을 시작하면 첫 메시지를 분석
 * 2. AI가 메시지 내용을 요약해서 간단한 제목 생성
 * 3. 생성된 제목이 사이드바의 채팅 히스토리에 표시됨
 *
 * 예시:
 * - 사용자 메시지: "파이썬으로 피보나치 수열을 구현하는 방법을 알려주세요"
 * - 생성된 제목: "파이썬 피보나치 수열 구현"
 *
 * @param message - 제목 생성의 기반이 될 사용자 메시지
 * @returns 생성된 채팅방 제목 (80자 이하)
 */
export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'), // 제목 생성 전용 모델 사용
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message), // 사용자 메시지를 JSON으로 변환하여 전달
  });

  return title;
}

/**
 * 특정 메시지 이후의 모든 메시지들을 삭제 (메시지 편집 기능용)
 *
 * 사용 시나리오:
 * - 사용자가 이전 메시지를 편집할 때
 * - 편집된 메시지 이후의 모든 대화 내용을 삭제해야 함
 * - 대화의 일관성을 유지하기 위한 조치
 *
 * 작동 방식:
 * 1. 편집하려는 메시지의 정보를 조회
 * 2. 해당 메시지의 생성 시간을 기준점으로 설정
 * 3. 그 시간 이후에 생성된 모든 메시지들을 데이터베이스에서 삭제
 *
 * @param id - 기준점이 될 메시지의 ID
 */
export async function deleteTrailingMessages({ id }: { id: string }) {
  // 기준 메시지의 정보를 데이터베이스에서 조회
  const [message] = await getMessageById({ id });

  // 해당 메시지의 생성 시간 이후의 모든 메시지들을 삭제
  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId, // 같은 채팅방 내에서만
    timestamp: message.createdAt, // 이 시간 이후의 메시지들
  });
}

/**
 * 채팅방의 가시성 설정을 변경 (공개/비공개)
 *
 * 가시성 타입:
 * - 'public': 다른 사용자들이 볼 수 있는 공개 채팅
 * - 'private': 본인만 볼 수 있는 비공개 채팅
 *
 * 사용 장면:
 * - 사용자가 채팅 헤더의 가시성 선택기를 조작할 때
 * - 민감한 내용의 채팅을 비공개로 전환
 * - 유용한 대화를 다른 사람들과 공유하기 위해 공개로 전환
 *
 * @param chatId - 가시성을 변경할 채팅방의 ID
 * @param visibility - 새로운 가시성 설정 ('public' 또는 'private')
 */
export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  // 데이터베이스에서 해당 채팅방의 가시성 설정을 업데이트
  await updateChatVisiblityById({ chatId, visibility });
}
