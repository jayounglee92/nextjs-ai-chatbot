# Next.js AI Chatbot 데이터베이스 문서

이 문서는 Next.js AI Chatbot 애플리케이션의 데이터베이스 구조와 관련 파일들에 대한 상세한 설명을 제공합니다.

## 목차

- [개요](#개요)
- [데이터베이스 구조](#데이터베이스-구조)
- [파일 구조](#파일-구조)
- [스키마 정의](#스키마-정의)
- [쿼리 함수](#쿼리-함수)
- [마이그레이션](#마이그레이션)
- [유틸리티](#유틸리티)

---

## 개요

### 기술 스택

- **ORM**: Drizzle ORM
- **데이터베이스**: PostgreSQL
- **마이그레이션**: Drizzle Kit
- **연결**: postgres.js
- **타입 안전성**: TypeScript + Drizzle의 타입 추론

### 주요 특징

- 완전한 타입 안전성
- 자동 마이그레이션 생성
- 커서 기반 페이지네이션
- 일관된 에러 처리
- 스키마 버전 관리

---

## 데이터베이스 구조

### 테이블 관계도

```
User (1) ─────── (N) Chat
                    │
                    ├─── (N) Message_v2
                    ├─── (N) Vote_v2
                    └─── (N) Stream

User (1) ─────── (N) Document ─────── (N) Suggestion
```

### 테이블 상세

#### User 테이블

| 필드명     | 타입        | 제약조건                    | 설명               |
| ---------- | ----------- | --------------------------- | ------------------ |
| `id`       | UUID        | PRIMARY KEY, DEFAULT RANDOM | 사용자 고유 식별자 |
| `email`    | VARCHAR(64) | NOT NULL                    | 사용자 이메일      |
| `password` | VARCHAR(64) | NULL 허용                   | 해시된 비밀번호    |

#### Chat 테이블

| 필드명       | 타입                     | 제약조건                    | 설명             |
| ------------ | ------------------------ | --------------------------- | ---------------- |
| `id`         | UUID                     | PRIMARY KEY, DEFAULT RANDOM | 채팅 고유 식별자 |
| `createdAt`  | TIMESTAMP                | NOT NULL                    | 채팅 생성 시간   |
| `title`      | TEXT                     | NOT NULL                    | 채팅 제목        |
| `userId`     | UUID                     | NOT NULL, FOREIGN KEY       | 채팅 소유자 ID   |
| `visibility` | ENUM('public','private') | NOT NULL, DEFAULT 'private' | 채팅 공개 설정   |

#### Message_v2 테이블

| 필드명        | 타입      | 제약조건                    | 설명                                |
| ------------- | --------- | --------------------------- | ----------------------------------- |
| `id`          | UUID      | PRIMARY KEY, DEFAULT RANDOM | 메시지 고유 식별자                  |
| `chatId`      | UUID      | NOT NULL, FOREIGN KEY       | 소속 채팅 ID                        |
| `role`        | VARCHAR   | NOT NULL                    | 메시지 역할 ('user' \| 'assistant') |
| `parts`       | JSON      | NOT NULL                    | 메시지 내용 (텍스트/파일 배열)      |
| `attachments` | JSON      | NOT NULL                    | 첨부파일 정보                       |
| `createdAt`   | TIMESTAMP | NOT NULL                    | 메시지 생성 시간                    |

#### Vote_v2 테이블

| 필드명      | 타입    | 제약조건                           | 설명                                      |
| ----------- | ------- | ---------------------------------- | ----------------------------------------- |
| `chatId`    | UUID    | NOT NULL, FOREIGN KEY, PRIMARY KEY | 채팅 ID                                   |
| `messageId` | UUID    | NOT NULL, FOREIGN KEY, PRIMARY KEY | 투표 대상 메시지 ID                       |
| `isUpvoted` | BOOLEAN | NOT NULL                           | 좋아요 여부 (true: 좋아요, false: 싫어요) |

#### Document 테이블

| 필드명      | 타입                                | 제약조건                     | 설명                |
| ----------- | ----------------------------------- | ---------------------------- | ------------------- |
| `id`        | UUID                                | NOT NULL, PRIMARY KEY (복합) | 문서 고유 식별자    |
| `createdAt` | TIMESTAMP                           | NOT NULL, PRIMARY KEY (복합) | 문서 생성/수정 시간 |
| `title`     | TEXT                                | NOT NULL                     | 문서 제목           |
| `content`   | TEXT                                | NULL 허용                    | 문서 내용           |
| `kind`      | ENUM('text','code','image','sheet') | NOT NULL, DEFAULT 'text'     | 문서 타입           |
| `userId`    | UUID                                | NOT NULL, FOREIGN KEY        | 문서 소유자 ID      |

#### Suggestion 테이블

| 필드명              | 타입      | 제약조건                     | 설명                |
| ------------------- | --------- | ---------------------------- | ------------------- |
| `id`                | UUID      | PRIMARY KEY, DEFAULT RANDOM  | 제안 고유 식별자    |
| `documentId`        | UUID      | NOT NULL, FOREIGN KEY (복합) | 대상 문서 ID        |
| `documentCreatedAt` | TIMESTAMP | NOT NULL, FOREIGN KEY (복합) | 대상 문서 생성 시간 |
| `originalText`      | TEXT      | NOT NULL                     | 원본 텍스트         |
| `suggestedText`     | TEXT      | NOT NULL                     | 제안된 텍스트       |
| `description`       | TEXT      | NULL 허용                    | 제안 설명           |
| `isResolved`        | BOOLEAN   | NOT NULL, DEFAULT FALSE      | 제안 해결 여부      |
| `userId`            | UUID      | NOT NULL, FOREIGN KEY        | 제안 작성자 ID      |
| `createdAt`         | TIMESTAMP | NOT NULL                     | 제안 생성 시간      |

#### Stream 테이블

| 필드명      | 타입      | 제약조건                    | 설명               |
| ----------- | --------- | --------------------------- | ------------------ |
| `id`        | UUID      | PRIMARY KEY, DEFAULT RANDOM | 스트림 고유 식별자 |
| `chatId`    | UUID      | NOT NULL, FOREIGN KEY       | 관련 채팅 ID       |
| `createdAt` | TIMESTAMP | NOT NULL                    | 스트림 생성 시간   |

---

## 파일 구조

```
lib/db/
├── schema.ts          # 데이터베이스 스키마 정의
├── queries.ts         # 데이터베이스 쿼리 함수들
├── utils.ts           # 비밀번호 해싱 등 유틸리티
├── migrate.ts         # 마이그레이션 실행 스크립트
├── migrations/        # SQL 마이그레이션 파일들
│   ├── 0000_keen_devos.sql
│   ├── 0001_sparkling_blue_marvel.sql
│   ├── ...
│   ├── 0006_marvelous_frog_thor.sql
│   └── meta/          # 마이그레이션 메타데이터
└── helpers/           # 마이그레이션 헬퍼
    └── 01-core-to-parts.ts
```

---

## 스키마 정의

### 파일: `lib/db/schema.ts`

#### 주요 특징

- **Drizzle ORM** 사용으로 완전한 타입 안전성
- **복합 기본키** 지원 (Document, Vote)
- **외래키 제약조건** 명시적 정의
- **Enum 타입** 활용 (visibility, kind)
- **버전 관리**: 기존 테이블 유지하며 새 버전 생성

#### 스키마 버전 관리

```typescript
// 기존 버전 (DEPRECATED)
export const messageDeprecated = pgTable('Message', { ... });
export const voteDeprecated = pgTable('Vote', { ... });

// 새 버전 (현재 사용)
export const message = pgTable('Message_v2', { ... });
export const vote = pgTable('Vote_v2', { ... });
```

#### 타입 추론

```typescript
export type User = InferSelectModel<typeof user>;
export type Chat = InferSelectModel<typeof chat>;
export type DBMessage = InferSelectModel<typeof message>;
// ...
```

---

## 쿼리 함수

### 파일: `lib/db/queries.ts`

#### 주요 특징

- **Server-only**: 클라이언트에서 실행 방지
- **일관된 에러 처리**: ChatSDKError 사용
- **타입 안전성**: 모든 쿼리가 타입 체크됨
- **성능 최적화**: 효율적인 쿼리 패턴

#### 카테고리별 함수

##### 사용자 관리

```typescript
getUser(email: string)              // 이메일로 사용자 조회
createUser(email, password)         // 새 사용자 생성
createGuestUser()                   // 게스트 사용자 생성
```

##### 채팅 관리

```typescript
saveChat({ id, userId, title, visibility }); // 새 채팅 저장
deleteChatById({ id }); // 채팅 삭제 (관련 데이터 포함)
getChatById({ id }); // 채팅 조회
getChatsByUserId({ id, limit, startingAfter, endingBefore }); // 페이지네이션 조회
updateChatVisiblityById({ chatId, visibility }); // 채팅 공개 설정 변경
```

##### 메시지 관리

```typescript
saveMessages({ messages }); // 메시지 배열 저장
getMessagesByChatId({ id }); // 채팅의 모든 메시지 조회
getMessageById({ id }); // 특정 메시지 조회
deleteMessagesByChatIdAfterTimestamp(); // 특정 시점 이후 메시지 삭제
getMessageCountByUserId(); // 사용자의 메시지 수 조회 (제한 확인용)
```

##### 투표 관리

```typescript
voteMessage({ chatId, messageId, type }); // 메시지 투표 (좋아요/싫어요)
getVotesByChatId({ id }); // 채팅의 모든 투표 조회
```

##### 문서 관리

```typescript
saveDocument({ id, title, kind, content, userId }); // 문서 저장
getDocumentsById({ id }); // 문서의 모든 버전 조회
getDocumentById({ id }); // 문서 최신 버전 조회
deleteDocumentsByIdAfterTimestamp(); // 특정 시점 이후 버전 삭제
```

##### 제안 관리

```typescript
saveSuggestions({ suggestions }); // 제안 배열 저장
getSuggestionsByDocumentId({ documentId }); // 문서의 제안들 조회
```

##### 스트림 관리

```typescript
createStreamId({ streamId, chatId }); // 새 스트림 ID 생성
getStreamIdsByChatId({ chatId }); // 채팅의 스트림 ID들 조회
```

#### 특별 기능: 커서 기반 페이지네이션

`getChatsByUserId` 함수는 효율적인 무한 스크롤을 위한 커서 기반 페이지네이션을 구현합니다:

```typescript
// 다음 페이지 (더 오래된 채팅)
getChatsByUserId({
  id: userId,
  limit: 10,
  endingBefore: lastChatId, // 마지막 채팅 ID 이전 것들
});

// 이전 페이지 (더 최근 채팅)
getChatsByUserId({
  id: userId,
  limit: 10,
  startingAfter: firstChatId, // 첫 채팅 ID 이후 것들
});
```

**장점**:

- 일관된 성능 (OFFSET 방식보다 빠름)
- 실시간 데이터 변경에 안정적
- 중복 데이터 방지

---

## 마이그레이션

### 파일: `lib/db/migrate.ts`

#### 마이그레이션 실행기

```typescript
const runMigrate = async () => {
  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
};
```

#### 사용법

```bash
# 마이그레이션 실행
npm run db:migrate

# 또는 직접 실행
node lib/db/migrate.ts
```

### 마이그레이션 파일들

#### 파일 명명 규칙

- `0000_keen_devos.sql` - 초기 스키마 (User, Chat)
- `0001_sparkling_blue_marvel.sql` - Message 테이블 추가
- `0002_wandering_riptide.sql` - Vote 테이블 추가
- `0003_cloudy_glorian.sql` - Document 테이블 추가
- `0004_odd_slayback.sql` - Suggestion 테이블 추가
- `0005_wooden_whistler.sql` - Message_v2, Vote_v2 추가
- `0006_marvelous_frog_thor.sql` - Stream 테이블 추가

#### 메타데이터

`migrations/meta/` 폴더에는 각 마이그레이션의 스냅샷과 저널이 저장됩니다:

- `_journal.json` - 마이그레이션 실행 기록
- `0000_snapshot.json` - 각 마이그레이션 시점의 스키마 스냅샷

---

## 유틸리티

### 파일: `lib/db/utils.ts`

#### 비밀번호 관리

```typescript
// 비밀번호 해싱
generateHashedPassword(password: string): string

// 더미 비밀번호 생성 (게스트 사용자용)
generateDummyPassword(): string
```

#### 특징

- **bcrypt-ts** 사용으로 안전한 해싱
- Salt 라운드: 10 (보안과 성능의 균형)
- 게스트 사용자를 위한 랜덤 비밀번호 생성

---

## 헬퍼 함수

### 파일: `lib/db/helpers/01-core-to-parts.ts`

#### 용도

이전 버전의 AI SDK (v4.3.13)에서 새 버전으로 마이그레이션하기 위한 헬퍼 스크립트입니다.

#### 주요 기능

- 기존 `Message` 테이블에서 `Message_v2`로 데이터 변환
- 메시지 구조 변경: `content` → `parts`
- 투표 데이터 마이그레이션
- 배치 처리로 대용량 데이터 안전 처리

#### 현재 상태

주석 처리되어 있으며, 필요 시 활성화하여 사용할 수 있습니다.

---

## 에러 처리

### 일관된 에러 처리

모든 데이터베이스 쿼리 함수는 `ChatSDKError`를 사용한 일관된 에러 처리를 제공합니다:

```typescript
try {
  return await db.select().from(user).where(eq(user.email, email));
} catch (error) {
  throw new ChatSDKError("bad_request:database", "Failed to get user by email");
}
```

### 에러 타입

- `bad_request:database` - 일반적인 데이터베이스 오류
- `not_found:database` - 요청된 리소스를 찾을 수 없음

---

## 성능 최적화

### 인덱스 전략

- **기본키**: 모든 테이블에 UUID 기본키
- **외래키**: 자동 인덱스 생성
- **정렬**: `createdAt` 컬럼 기준 정렬 최적화

### 쿼리 최적화

- **배치 삽입**: 대량 데이터 처리 시 배치 단위로 처리
- **선택적 조회**: 필요한 컬럼만 선택
- **조건부 쿼리**: 불필요한 쿼리 실행 방지

### 연결 관리

```typescript
// 마이그레이션 시 단일 연결 사용
const connection = postgres(process.env.POSTGRES_URL, { max: 1 });

// 일반 운영 시 연결 풀 사용
const client = postgres(process.env.POSTGRES_URL!);
```

---

## 보안 고려사항

### 비밀번호 보안

- bcrypt를 사용한 안전한 해싱
- Salt 라운드 10으로 무차별 대입 공격 방어

### SQL 인젝션 방지

- Drizzle ORM의 파라미터화된 쿼리 사용
- 모든 사용자 입력 값 검증

### 권한 관리

- 사용자별 데이터 격리
- 외래키 제약조건으로 데이터 무결성 보장

---

이 문서는 Next.js AI Chatbot의 데이터베이스 구조와 관련 구현에 대한 완전한 참조 가이드입니다. 각 구성요소의 상세한 구현은 해당 파일에서 확인할 수 있습니다.
