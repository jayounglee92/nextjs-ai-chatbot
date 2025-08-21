import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { getChatsByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

/**
 * 채팅 히스토리 조회 API
 *
 * GET /api/history
 *
 * 현재 로그인한 사용자의 채팅 히스토리를 페이지네이션으로 조회합니다.
 * 커서 기반 페이지네이션을 사용하여 효율적인 데이터 로딩을 지원합니다.
 *
 * 쿼리 파라미터:
 * - limit: 한 번에 가져올 채팅 수 (기본값: 10)
 * - starting_after: 이 ID 이후의 채팅들을 가져옴 (다음 페이지)
 * - ending_before: 이 ID 이전의 채팅들을 가져옴 (이전 페이지)
 */
export async function GET(request: NextRequest) {
  // URL에서 쿼리 파라미터 추출
  const { searchParams } = request.nextUrl;

  // 페이지네이션 파라미터 파싱
  const limit = Number.parseInt(searchParams.get('limit') || '10'); // 기본값 10개
  const startingAfter = searchParams.get('starting_after'); // 커서: 이 ID 이후
  const endingBefore = searchParams.get('ending_before'); // 커서: 이 ID 이전

  // 잘못된 페이지네이션 파라미터 검증
  // starting_after와 ending_before는 동시에 사용할 수 없음
  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  // 사용자 인증 확인
  const session = await auth();

  // 로그인하지 않은 사용자는 히스토리 조회 불가
  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  // 데이터베이스에서 사용자의 채팅 히스토리 조회
  // 커서 기반 페이지네이션으로 효율적인 데이터 로딩
  const chats = await getChatsByUserId({
    id: session.user.id, // 현재 사용자 ID
    limit, // 조회할 채팅 수
    startingAfter, // 시작 커서 (다음 페이지용)
    endingBefore, // 종료 커서 (이전 페이지용)
  });

  // JSON 형태로 채팅 히스토리 반환
  return Response.json(chats);
}
