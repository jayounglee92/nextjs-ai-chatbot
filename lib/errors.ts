export type ErrorType =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limit'
  | 'offline';

export type Surface =
  | 'chat'
  | 'auth'
  | 'api'
  | 'stream'
  | 'database'
  | 'history'
  | 'vote'
  | 'document'
  | 'suggestions';

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = 'response' | 'log' | 'none';

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  database: 'log',
  chat: 'response',
  auth: 'response',
  stream: 'response',
  api: 'response',
  history: 'response',
  vote: 'response',
  document: 'response',
  suggestions: 'response',
};

export class ChatSDKError extends Error {
  public type: ErrorType;
  public surface: Surface;
  public statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    super();

    const [type, surface] = errorCode.split(':');

    this.type = type as ErrorType;
    this.cause = cause;
    this.surface = surface as Surface;
    this.message = getMessageByErrorCode(errorCode);
    this.statusCode = getStatusCodeByType(this.type);
  }

  public toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];

    const { message, cause, statusCode } = this;

    if (visibility === 'log') {
      console.error({
        code,
        message,
        cause,
      });

      return Response.json(
        { code: '', message: 'Something went wrong. Please try again later.' },
        { status: statusCode },
      );
    }

    return Response.json({ code, message, cause }, { status: statusCode });
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  if (errorCode.includes('database')) {
    return 'An error occurred while executing a database query.';
  }

  switch (errorCode) {
    case 'bad_request:api':
      return '잘못된 요청입니다. 요청을 확인하고 다시 시도해주세요.';

    case 'unauthorized:auth':
      return '로그인이 필요합니다. 로그인하고 다시 시도해주세요.';

    case 'forbidden:auth':
      return '계정에 접근 권한이 없습니다.';

    case 'rate_limit:chat':
      return '하루에 최대 메시지 수를 초과했습니다. 나중에 다시 시도해주세요.';

    case 'not_found:chat':
      return '요청한 채팅이 없습니다. 채팅 ID를 확인하고 다시 시도해주세요.';

    case 'forbidden:chat':
      return '이 채팅은 다른 사용자의 소유입니다. 채팅 ID를 확인하고 다시 시도해주세요.';

    case 'unauthorized:chat':
      return '채팅을 보려면 로그인이 필요합니다. 로그인하고 다시 시도해주세요.';

    case 'offline:chat':
      return '메시지를 보내는 중 문제가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';

    case 'not_found:document':
      return '요청한 문서가 없습니다. 문서 ID를 확인하고 다시 시도해주세요.';

    case 'forbidden:document':
      return '이 문서는 다른 사용자의 소유입니다. 문서 ID를 확인하고 다시 시도해주세요.';

    case 'unauthorized:document':
      return '문서를 보려면 로그인이 필요합니다. 로그인하고 다시 시도해주세요.';

    case 'bad_request:document':
      return '문서를 생성하거나 업데이트하는 요청이 잘못되었습니다. 입력을 확인하고 다시 시도해주세요.';

    default:
      return '문제가 발생했습니다. 나중에 다시 시도해주세요.';
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case 'bad_request':
      return 400;
    case 'unauthorized':
      return 401;
    case 'forbidden':
      return 403;
    case 'not_found':
      return 404;
    case 'rate_limit':
      return 429;
    case 'offline':
      return 503;
    default:
      return 500;
  }
}
