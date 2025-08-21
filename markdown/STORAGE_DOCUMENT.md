# Next.js AI Chatbot 서드파티 서비스 문서

이 문서는 Next.js AI Chatbot 애플리케이션에서 사용하는 모든 서드파티 서비스와 환경변수에 대한 상세한 설명을 제공합니다.

## 목차

- [환경변수 개요](#환경변수-개요)
- [데이터베이스 (Neon)](#데이터베이스-neon)
- [인증 서비스 (NextAuth.js)](#인증-서비스-nextauthjs)
- [파일 저장소 (Vercel Blob)](#파일-저장소-vercel-blob)
- [캐시 및 스트림 (Redis/Upstash)](#캐시-및-스트림-redisupstash)
- [AI 모델 (OpenAI)](#ai-모델-openai)
- [배포 및 호스팅 (Vercel)](#배포-및-호스팅-vercel)
- [모니터링 및 분석](#모니터링-및-분석)

---

## 환경변수 개요

### 필수 환경변수

| 환경변수         | 서비스      | 설명                             | 예시 값                          |
| ---------------- | ----------- | -------------------------------- | -------------------------------- |
| `POSTGRES_URL`   | Neon        | PostgreSQL 데이터베이스 연결 URL | `postgresql://user:pass@host/db` |
| `AUTH_SECRET`    | NextAuth.js | JWT 토큰 암호화용 시크릿 키      | `your-secret-key`                |
| `OPENAI_API_KEY` | OpenAI      | OpenAI API 접근 키               | `sk-...`                         |

### 선택적 환경변수

| 환경변수                | 서비스        | 설명                           | 기본값        |
| ----------------------- | ------------- | ------------------------------ | ------------- |
| `REDIS_URL`             | Upstash/Redis | Redis 연결 URL (스트림 재개용) | -             |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob   | 파일 업로드/다운로드 토큰      | -             |
| `NODE_ENV`              | Node.js       | 실행 환경                      | `development` |

### 환경변수 파일 구조

```bash
# .env.local 파일 예시
POSTGRES_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb"
AUTH_SECRET="your-super-secret-key-here"
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
REDIS_URL="redis://default:password@redis-host:6379"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxx"
```

---

## 데이터베이스 (Neon)

### 서비스 개요

**Neon**은 PostgreSQL 호환 서버리스 데이터베이스 서비스입니다.

### 주요 특징

- **서버리스**: 자동 스케일링 및 휴면 모드
- **브랜칭**: Git과 같은 데이터베이스 브랜치 기능
- **PostgreSQL 호환**: 완전한 PostgreSQL 기능 지원
- **백업 및 복원**: 자동 백업 및 포인트인타임 복구

### 환경변수

```bash
POSTGRES_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb"
```

### 사용 위치

- `lib/db/queries.ts`: 데이터베이스 연결
- `lib/db/migrate.ts`: 마이그레이션 실행
- `drizzle.config.ts`: Drizzle ORM 설정

### 코드 예시

```typescript
// lib/db/queries.ts
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);
```

### 비용 및 제한사항

- **Free Tier**: 1개 프로젝트, 3GB 저장소
- **Pro Tier**: 무제한 프로젝트, 오토스케일링
- **연결 제한**: Free tier 20개 동시 연결

---

## 인증 서비스 (NextAuth.js)

### 서비스 개요

**NextAuth.js**는 Next.js를 위한 완전한 인증 솔루션입니다.

### 주요 특징

- **다중 인증 제공자**: OAuth, 이메일, 자격증명
- **세션 관리**: JWT 또는 데이터베이스 세션
- **보안**: CSRF 보호, 암호화된 쿠키
- **TypeScript 지원**: 완전한 타입 안전성

### 환경변수

```bash
AUTH_SECRET="your-super-secret-key-here"
```

### 인증 제공자 설정

#### 1. 자격증명 인증 (이메일/비밀번호)

```typescript
// app/(auth)/auth.ts
Credentials({
  credentials: {},
  async authorize({ email, password }: any) {
    const users = await getUser(email);
    // 비밀번호 검증 로직
    return { ...user, type: "regular" };
  },
});
```

#### 2. 게스트 인증

```typescript
Credentials({
  id: "guest",
  credentials: {},
  async authorize() {
    const [guestUser] = await createGuestUser();
    return { ...guestUser, type: "guest" };
  },
});
```

### 사용 위치

- `app/(auth)/auth.ts`: NextAuth 설정
- `middleware.ts`: 인증 미들웨어
- `app/(auth)/api/auth/[...nextauth]/route.ts`: API 라우트

### 세션 타입 확장

```typescript
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: "guest" | "regular";
    } & DefaultSession["user"];
  }
}
```

### 설정 방법

1. `openssl rand -base64 32`로 시크릿 키 생성
2. `.env.local`에 `AUTH_SECRET` 설정
3. OAuth 제공자 설정 (선택사항)

---

## 파일 저장소 (Vercel Blob)

### 서비스 개요

**Vercel Blob**은 Vercel의 서버리스 파일 저장소 서비스입니다.

### 주요 특징

- **서버리스**: 자동 스케일링
- **CDN 통합**: 전 세계 빠른 파일 제공
- **간단한 API**: 업로드/다운로드 간편 구현
- **보안**: 액세스 제어 및 토큰 기반 인증

### 환경변수

```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxx"
```

### 사용 위치

- `app/(chat)/api/files/upload/route.ts`: 파일 업로드 API
- `components/multimodal-input.tsx`: 클라이언트 파일 업로드

### 코드 예시

```typescript
// 파일 업로드
import { put } from "@vercel/blob";

const data = await put(`${filename}`, fileBuffer, {
  access: "public",
});

// 반환값
{
  url: string; // 공개 액세스 URL
  pathname: string; // 파일 경로
  contentType: string; // MIME 타입
}
```

### 파일 제한사항

- **크기 제한**: 5MB (설정 가능)
- **지원 형식**: JPEG, PNG (확장 가능)
- **보안**: 인증된 사용자만 업로드 가능

### 설정 방법

1. [Vercel Dashboard](https://vercel.com/dashboard)에서 Blob 활성화
2. 읽기/쓰기 토큰 생성
3. `.env.local`에 `BLOB_READ_WRITE_TOKEN` 설정

### 비용

- **Hobby**: 1GB 무료
- **Pro**: $0.15/GB
- **Enterprise**: 커스텀 가격

---

## 캐시 및 스트림 (Redis/Upstash)

### 서비스 개요

**Upstash Redis**는 서버리스 Redis 서비스로, 채팅 스트림 재개 기능에 사용됩니다.

### 주요 특징

- **서버리스**: 사용량 기반 과금
- **Redis 호환**: 완전한 Redis API 지원
- **글로벌 복제**: 낮은 지연시간
- **REST API**: HTTP를 통한 Redis 접근

### 환경변수

```bash
REDIS_URL="redis://default:password@redis-host:6379"
```

### 사용 위치

- `app/(chat)/api/chat/route.ts`: 재개 가능한 스트림 컨텍스트

### 코드 예시

```typescript
// 스트림 컨텍스트 생성
export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          "> Resumable streams are disabled due to missing REDIS_URL"
        );
      }
    }
  }
  return globalStreamContext;
}
```

### 기능

- **스트림 재개**: 중단된 AI 응답 스트림 재개
- **세션 저장**: 임시 스트림 데이터 보관
- **성능 향상**: 빠른 데이터 액세스

### 설정 방법 (선택사항)

1. [Upstash Console](https://console.upstash.com) 회원가입
2. Redis 데이터베이스 생성
3. 연결 URL 복사
4. `.env.local`에 `REDIS_URL` 설정

**참고**: Redis가 없어도 애플리케이션은 정상 작동하며, 스트림 재개 기능만 비활성화됩니다.

---

## AI 모델 (OpenAI)

### 서비스 개요

**OpenAI**는 GPT 모델을 제공하는 AI 서비스입니다.

### 주요 특징

- **다양한 모델**: GPT-4o, GPT-3.5, DALL-E
- **스트리밍**: 실시간 응답 생성
- **도구 사용**: Function calling 지원
- **멀티모달**: 텍스트, 이미지 처리

### 환경변수

```bash
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 사용 모델

| 모델 ID                | OpenAI 모델          | 용도           |
| ---------------------- | -------------------- | -------------- |
| `chat-model`           | `gpt-4o`             | 일반 채팅      |
| `chat-model-reasoning` | `gpt-4o` (추론 모드) | 복잡한 추론    |
| `title-model`          | `gpt-4o`             | 채팅 제목 생성 |
| `artifact-model`       | `gpt-4o`             | 아티팩트 생성  |
| `small-model`          | `dall-e-2`           | 이미지 생성    |

### 사용 위치

- `lib/ai/providers.ts`: AI 모델 설정
- `app/(chat)/api/chat/route.ts`: 채팅 API에서 모델 사용

### 코드 예시

```typescript
// lib/ai/providers.ts
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const myProvider = customProvider({
  languageModels: {
    "chat-model": openai("gpt-4o"),
    "chat-model-reasoning": wrapLanguageModel({
      model: openai("gpt-4o"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
  },
  imageModels: {
    "small-model": openai.image("dall-e-2"),
  },
});
```

### 사용량 제한

- **일일 제한**: 사용자 타입별 차등 적용
- **Rate Limiting**: API 호출 빈도 제한
- **토큰 제한**: 모델별 최대 토큰 수

---

## 배포 및 호스팅 (Vercel)

### 서비스 개요

**Vercel**은 Next.js 애플리케이션을 위한 서버리스 배포 플랫폼입니다.

### 주요 특징

- **원클릭 배포**: GitHub 연동 자동 배포
- **서버리스 함수**: API 라우트 자동 스케일링
- **CDN**: 전 세계 빠른 콘텐츠 제공
- **환경변수 관리**: 보안 설정 관리

### 배포 URL

```
https://vercel.com/new/clone?repository-url=https://github.com/vercel/ai-chatbot&env=AUTH_SECRET&products=[{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"},{"type":"integration","protocol":"storage","productSlug":"upstash-kv","integrationSlug":"upstash"},{"type":"blob"}]
```

### 통합 서비스

배포 시 자동으로 설정되는 서비스들:

1. **Neon Database**: PostgreSQL 데이터베이스
2. **Upstash KV**: Redis 캐시
3. **Vercel Blob**: 파일 저장소
4. **OpenAI Integration**: AI 모델 연동

### 환경변수 설정

Vercel Dashboard에서 다음 환경변수 설정:

- `POSTGRES_URL`: Neon에서 자동 설정
- `REDIS_URL`: Upstash에서 자동 설정
- `BLOB_READ_WRITE_TOKEN`: Vercel에서 자동 설정
- `AUTH_SECRET`: 수동 설정 필요
- `OPENAI_API_KEY`: 수동 설정 필요

### 배포 과정

1. GitHub 저장소 연결
2. 환경변수 설정
3. 통합 서비스 활성화
4. 자동 빌드 및 배포

---

## 모니터링 및 분석

### Vercel Analytics

```typescript
// 사용량 및 성능 분석
import { Analytics } from "@vercel/analytics/react";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
```

### OpenTelemetry

```typescript
// 성능 모니터링 및 추적
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';

// 실험적 텔레메트리 설정
experimental_telemetry: {
  isEnabled: isProductionEnvironment,
  functionId: 'stream-text',
}
```

---

## 보안 고려사항

### 환경변수 보안

- **절대 커밋하지 않기**: `.env*` 파일은 `.gitignore`에 포함
- **프로덕션 분리**: 개발/프로덕션 환경변수 분리
- **최소 권한 원칙**: 필요한 권한만 부여

### API 키 관리

- **정기적 교체**: API 키 주기적 갱신
- **모니터링**: 비정상적 사용량 감지
- **제한 설정**: Rate limiting 및 사용량 제한

### 데이터베이스 보안

- **연결 암호화**: SSL/TLS 연결 사용
- **접근 제어**: IP 화이트리스트 설정
- **정기 백업**: 자동 백업 설정

---

## 문제 해결

### 일반적인 오류

#### 1. 환경변수 누락

```bash
Error: POSTGRES_URL is not defined
```

**해결**: `.env.local` 파일에 필수 환경변수 설정

#### 2. 데이터베이스 연결 실패

```bash
Error: Connection failed
```

**해결**: Neon 데이터베이스 URL 및 권한 확인

#### 3. Redis 연결 실패

```bash
> Resumable streams are disabled due to missing REDIS_URL
```

**해결**: 선택사항이므로 무시 가능, 또는 Redis URL 설정

#### 4. 파일 업로드 실패

```bash
Error: Upload failed
```

**해결**: Vercel Blob 토큰 및 권한 확인

### 디버깅 도구

- **Vercel Logs**: 배포된 함수 로그 확인
- **Neon Console**: 데이터베이스 쿼리 모니터링
- **OpenAI Usage**: API 사용량 및 오류 확인

---

## 비용 최적화

### 서비스별 비용 관리

#### Neon

- **Free Tier 활용**: 개발 환경에서 무료 티어 사용
- **연결 풀링**: 불필요한 연결 최소화

#### OpenAI

- **토큰 최적화**: 프롬프트 길이 최소화
- **캐싱**: 반복 요청 캐시 활용
- **모델 선택**: 용도에 맞는 모델 선택

#### Vercel

- **함수 최적화**: 실행 시간 최소화
- **대역폭 관리**: 불필요한 데이터 전송 줄이기

### 모니터링 설정

- **사용량 알림**: 임계값 도달 시 알림 설정
- **정기 검토**: 월별 비용 검토 및 최적화

---

이 문서는 Next.js AI Chatbot에서 사용하는 모든 서드파티 서비스에 대한 완전한 참조 가이드입니다. 각 서비스의 설정 방법과 사용 방법을 상세히 설명하여 개발자가 쉽게 환경을 구성하고 관리할 수 있도록 돕습니다.
