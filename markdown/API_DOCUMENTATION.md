# Next.js AI Chatbot API 문서

이 문서는 Next.js AI Chatbot 애플리케이션의 모든 API 엔드포인트에 대한 상세한 설명과 사용 방법을 제공합니다.

## 목차

- [인증 API](#인증-api)
- [채팅 API](#채팅-api)
- [파일 업로드 API](#파일-업로드-api)
- [문서 관리 API](#문서-관리-api)
- [투표 API](#투표-api)
- [제안 API](#제안-api)
- [히스토리 API](#히스토리-api)

---

## 인증 API

### 1. NextAuth 인증

**엔드포인트**: `GET/POST /api/auth/[...nextauth]`

NextAuth.js를 통한 표준 인증 처리를 담당합니다.

**기능**:

- 로그인/로그아웃 처리
- 세션 관리
- OAuth 제공자 인증

**요청 본문**:

```typescript
// 로그인 시 (POST)
{
  email?: string;
  password?: string;
  provider?: string;  // OAuth 제공자 (google, github 등)
}
```

**응답 본문**:

```typescript
// 성공 시
{
  user: {
    id: string;
    email: string;
    name?: string;
  };
  session: {
    sessionToken: string;
    expires: string;
  };
}

// 실패 시
{
  error: string;
  message: string;
}
```

**클라이언트 사용 예시**:

```typescript
import { signIn, signOut } from "next-auth/react";

// 로그인
await signIn("credentials", {
  email: "user@example.com",
  password: "password123",
  redirect: false,
});

// OAuth 로그인
await signIn("google", { redirect: false });

// 로그아웃
await signOut({ redirect: false });
```

**구현**: `app/(auth)/api/auth/[...nextauth]/route.ts`

```typescript
export { GET, POST } from "@/app/(auth)/auth";
```

### 2. 게스트 로그인

**엔드포인트**: `GET /api/auth/guest`

게스트 사용자로 자동 로그인을 처리합니다.

**쿼리 파라미터**:

| 파라미터      | 타입   | 필수 | 기본값 | 설명                     |
| ------------- | ------ | ---- | ------ | ------------------------ |
| `redirectUrl` | string | 선택 | `/`    | 로그인 후 리디렉션할 URL |

**요청 본문**: 없음 (GET 요청)

**응답 본문**:

```typescript
// 성공 시 (리디렉션)
// HTTP 302 Redirect to redirectUrl

// 실패 시
{
  error: string;
  message: string;
}
```

**클라이언트 사용 예시**:

```typescript
// 직접 URL 호출
window.location.href = "/api/auth/guest?redirectUrl=/chat/123";

// 또는 fetch를 사용한 처리
const guestLogin = async () => {
  const response = await fetch("/api/auth/guest?redirectUrl=/chat/123");
  if (response.redirected) {
    window.location.href = response.url;
  }
};
```

---

## 채팅 API

### 1. 채팅 메시지 전송

**엔드포인트**: `POST /api/chat`

새로운 채팅 메시지를 전송하고 AI 응답을 스트리밍으로 받습니다.

**요청 본문**:

```typescript
{
  id: string;                    // 채팅 세션 UUID
  message: {
    id: string;                  // 메시지 UUID
    role: 'user';               // 항상 'user'
    parts: [
      {
        type: 'text';
        text: string;            // 메시지 내용 (1-2000자)
      } | {
        type: 'file';
        mediaType: 'image/jpeg' | 'image/png';
        name: string;            // 파일명 (1-100자)
        url: string;             // 파일 URL
      }
    ];
  };
  selectedChatModel: 'chat-model' | 'chat-model-reasoning';
  selectedVisibilityType: 'public' | 'private';
}
```

**응답**:

- Server-Sent Events (SSE) 스트림
- 실시간 AI 응답 스트리밍
- 메시지 완료 시 데이터베이스에 저장

**특징**:

- 일일 메시지 제한 (사용자 타입별 차등)
- 지리적 위치 기반 컨텍스트 제공
- 도구 사용 가능 (날씨, 문서 생성 등)
- Redis를 통한 재개 가능한 스트림 지원

**클라이언트 사용 예시**:

```typescript
// components/chat.tsx에서 사용
const { sendMessage } = useChat({
  api: "/api/chat",
  transport: new DefaultChatTransport({
    api: "/api/chat",
    fetch: fetchWithErrorHandlers,
  }),
});
```

### 2. 채팅 삭제

**엔드포인트**: `DELETE /api/chat`

지정된 채팅을 삭제합니다.

**쿼리 파라미터**:

| 파라미터 | 타입   | 필수 | 설명                  |
| -------- | ------ | ---- | --------------------- |
| `id`     | string | 필수 | 삭제할 채팅 ID (UUID) |

**요청 본문**: 없음

**응답 본문**:

```typescript
// 성공 시
{
  id: string;
  createdAt: string;
  title: string;
  userId: string;
  visibility: 'public' | 'private';
}

// 실패 시
{
  error: string;
  code: string;
  cause?: string;
}
```

**권한**: 채팅 소유자만 삭제 가능

**클라이언트 사용 예시**:

```typescript
// components/sidebar-history.tsx에서 사용
const deleteChatById = async (chatId: string) => {
  try {
    const response = await fetch(`/api/chat?id=${chatId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete chat");
    }

    const deletedChat = await response.json();
    console.log("Deleted chat:", deletedChat);
    return deletedChat;
  } catch (error) {
    console.error("Error deleting chat:", error);
    throw error;
  }
};
```

### 3. 스트림 재개

**엔드포인트**: `GET /api/chat/[id]/stream`

중단된 채팅 스트리밍을 재개합니다.

**경로 파라미터**:

| 파라미터 | 타입   | 필수 | 설명           |
| -------- | ------ | ---- | -------------- |
| `id`     | string | 필수 | 채팅 ID (UUID) |

**요청 본문**: 없음 (GET 요청)

**응답 본문**:

```typescript
// Server-Sent Events 스트림
// Content-Type: text/event-stream

// 스트림 재개 시
data: {"type":"data-appendMessage","data":"{\"id\":\"msg-123\",\"role\":\"assistant\",\"parts\":[{\"type\":\"text\",\"text\":\"안녕하세요!\"}]}"}

// 빈 스트림 시 (HTTP 204)
// No Content

// 에러 시
{
  error: string;
  code: string;
  cause?: string;
}
```

**특징**:

- 15초 이내 생성된 메시지만 복원
- SSR 중 스트리밍 지원
- Redis 기반 재개 가능한 스트림

**클라이언트 사용 예시**:

```typescript
// 스트림 재개 요청
const resumeStream = async (chatId: string) => {
  try {
    const response = await fetch(`/api/chat/${chatId}/stream`);

    if (response.status === 204) {
      console.log("No stream to resume");
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to resume stream");
    }

    // SSE 스트림 처리
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      console.log("Stream chunk:", chunk);
    }
  } catch (error) {
    console.error("Error resuming stream:", error);
  }
};
```

---

## 파일 업로드 API

### 파일 업로드

**엔드포인트**: `POST /api/files/upload`

이미지 파일을 Vercel Blob에 업로드합니다.

**쿼리 파라미터**: 없음

**요청 본문**:

```typescript
// Content-Type: multipart/form-data
FormData {
  file: File;  // 업로드할 이미지 파일
}
```

**응답 본문**:

```typescript
// 성공 시
{
  url: string; // 업로드된 파일의 공개 URL
  pathname: string; // 파일 경로
  contentType: string; // MIME 타입 (image/jpeg, image/png)
}

// 실패 시
{
  error: string; // 에러 메시지
}
```

**제한사항**:

- 파일 크기: 최대 5MB
- 지원 형식: JPEG, PNG
- 인증 필요

**클라이언트 사용 예시**:

```typescript
// components/multimodal-input.tsx에서 사용
const uploadFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    console.log("File uploaded:", data);
    return data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// 파일 선택 및 업로드 예시
const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const uploadResult = await uploadFile(file);
    // 업로드된 파일 URL 사용
    setAttachments((prev) => [
      ...prev,
      {
        url: uploadResult.url,
        name: uploadResult.pathname,
        contentType: uploadResult.contentType,
      },
    ]);
  } catch (error) {
    toast.error("파일 업로드에 실패했습니다.");
  }
};
```

---

## 문서 관리 API

### 1. 문서 조회

**엔드포인트**: `GET /api/document`

문서의 모든 버전을 조회합니다.

**쿼리 파라미터**:

| 파라미터 | 타입   | 필수 | 설명           |
| -------- | ------ | ---- | -------------- |
| `id`     | string | 필수 | 문서 ID (UUID) |

**요청 본문**: 없음 (GET 요청)

**응답 본문**:

```typescript
// 성공 시
Array<{
  id: string;
  title: string;
  content: string | null;
  kind: "text" | "code" | "image" | "sheet";
  userId: string;
  createdAt: string; // ISO 8601 형식
}>

// 실패 시
{
  error: string;
  code: string;
  cause?: string;
}
```

**권한**: 문서 소유자만 접근 가능

**클라이언트 사용 예시**:

```typescript
// 문서 조회
const getDocumentVersions = async (documentId: string) => {
  try {
    const response = await fetch(`/api/document?id=${documentId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch document");
    }

    const documents = await response.json();
    console.log("Document versions:", documents);
    return documents;
  } catch (error) {
    console.error("Error fetching document:", error);
    throw error;
  }
};

// SWR을 사용한 문서 조회
import useSWR from "swr";

const useDocument = (documentId: string) => {
  const { data, error, mutate } = useSWR(
    documentId ? `/api/document?id=${documentId}` : null,
    fetcher
  );

  return {
    documents: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
};
```

### 2. 문서 저장

**엔드포인트**: `POST /api/document`

문서의 새 버전을 저장합니다.

**쿼리 파라미터**:

| 파라미터 | 타입   | 필수 | 설명           |
| -------- | ------ | ---- | -------------- |
| `id`     | string | 필수 | 문서 ID (UUID) |

**요청 본문**:

```typescript
{
  content: string; // 문서 내용
  title: string; // 문서 제목
  kind: "text" | "code" | "image" | "sheet"; // 문서 타입
}
```

**응답 본문**:

```typescript
// 성공 시
Array<{
  id: string;
  title: string;
  content: string;
  kind: "text" | "code" | "image" | "sheet";
  userId: string;
  createdAt: string; // ISO 8601 형식
}>

// 실패 시
{
  error: string;
  code: string;
  cause?: string;
}
```

**권한**: 문서 소유자만 저장 가능

**클라이언트 사용 예시**:

```typescript
// components/artifact.tsx에서 사용 (디바운싱 적용)
const saveDocument = async (
  documentId: string,
  content: string,
  title: string,
  kind: string
) => {
  try {
    const response = await fetch(`/api/document?id=${documentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        kind,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save document");
    }

    const savedDocument = await response.json();
    console.log("Document saved:", savedDocument);
    return savedDocument;
  } catch (error) {
    console.error("Error saving document:", error);
    throw error;
  }
};

// 디바운싱을 적용한 자동 저장
import { useDebounceCallback } from "usehooks-ts";

const useAutoSave = (documentId: string) => {
  const debouncedSave = useDebounceCallback(
    async (content: string, title: string, kind: string) => {
      await saveDocument(documentId, content, title, kind);
    },
    2000 // 2초 디바운싱
  );

  return { saveDocument: debouncedSave };
};
```

### 3. 문서 버전 삭제

**엔드포인트**: `DELETE /api/document`

지정된 타임스탬프 이후의 문서 버전들을 삭제합니다.

**쿼리 파라미터**:

| 파라미터    | 타입   | 필수 | 설명                            |
| ----------- | ------ | ---- | ------------------------------- |
| `id`        | string | 필수 | 문서 ID (UUID)                  |
| `timestamp` | string | 필수 | 기준 타임스탬프 (ISO 8601 형식) |

**요청 본문**: 없음

**응답 본문**:

```typescript
// 성공 시
Array<{
  id: string;
  title: string;
  content: string;
  kind: "text" | "code" | "image" | "sheet";
  userId: string;
  createdAt: string; // 삭제된 문서 버전들
}>

// 실패 시
{
  error: string;
  code: string;
  cause?: string;
}
```

**권한**: 문서 소유자만 삭제 가능

**클라이언트 사용 예시**:

```typescript
// 특정 시점 이후 문서 버전 삭제
const deleteDocumentVersionsAfter = async (
  documentId: string,
  timestamp: Date
) => {
  try {
    const response = await fetch(
      `/api/document?id=${documentId}&timestamp=${timestamp.toISOString()}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete document versions");
    }

    const deletedVersions = await response.json();
    console.log("Deleted versions:", deletedVersions);
    return deletedVersions;
  } catch (error) {
    console.error("Error deleting document versions:", error);
    throw error;
  }
};

// 문서 되돌리기 기능
const revertDocumentToVersion = async (
  documentId: string,
  targetVersion: Date
) => {
  try {
    // 대상 버전 이후의 모든 버전 삭제
    const deletedVersions = await deleteDocumentVersionsAfter(
      documentId,
      targetVersion
    );

    // UI 업데이트
    console.log(`Reverted to version: ${targetVersion.toISOString()}`);
    return deletedVersions;
  } catch (error) {
    console.error("Error reverting document:", error);
    throw error;
  }
};
```

---

## 투표 API

### 1. 투표 조회

**엔드포인트**: `GET /api/vote`

채팅의 모든 투표를 조회합니다.

**쿼리 파라미터**:

| 파라미터 | 타입   | 필수 | 설명           |
| -------- | ------ | ---- | -------------- |
| `chatId` | string | 필수 | 채팅 ID (UUID) |

**요청 본문**: 없음 (GET 요청)

**응답 본문**:

```typescript
// 성공 시
Array<{
  chatId: string;
  messageId: string;
  isUpvoted: boolean; // true: 좋아요, false: 싫어요
}>

// 실패 시
{
  error: string;
  code: string;
  cause?: string;
}
```

**권한**: 채팅 소유자만 접근 가능

**클라이언트 사용 예시**:

```typescript
// 채팅의 모든 투표 조회
const getVotesByChatId = async (chatId: string) => {
  try {
    const response = await fetch(`/api/vote?chatId=${chatId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch votes");
    }

    const votes = await response.json();
    console.log("Votes:", votes);
    return votes;
  } catch (error) {
    console.error("Error fetching votes:", error);
    throw error;
  }
};

// SWR을 사용한 투표 조회
import useSWR from "swr";

const useVotes = (chatId: string) => {
  const { data, error, mutate } = useSWR(
    chatId ? `/api/vote?chatId=${chatId}` : null,
    fetcher
  );

  return {
    votes: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
};
```

### 2. 메시지 투표

**엔드포인트**: `PATCH /api/vote`

AI 메시지에 대한 좋아요/싫어요 투표를 등록합니다.

**쿼리 파라미터**: 없음

**요청 본문**:

```typescript
{
  chatId: string; // 채팅 ID (UUID)
  messageId: string; // 메시지 ID (UUID)
  type: "up" | "down"; // 투표 타입 (up: 좋아요, down: 싫어요)
}
```

**응답 본문**:

```typescript
// 성공 시
"Message voted" // 단순 텍스트 응답

// 실패 시
{
  error: string;
  code: string;
  cause?: string;
}
```

**권한**: 채팅 소유자만 투표 가능

**클라이언트 사용 예시**:

```typescript
// components/message-actions.tsx에서 사용
const voteMessage = async (
  chatId: string,
  messageId: string,
  type: "up" | "down"
) => {
  try {
    const response = await fetch("/api/vote", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        messageId,
        type,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to vote message");
    }

    const result = await response.text();
    console.log("Vote result:", result);
    return result;
  } catch (error) {
    console.error("Error voting message:", error);
    throw error;
  }
};

// 낙관적 업데이트와 함께 사용
import { toast } from "sonner";
import { mutate } from "swr";

const handleUpvote = async (chatId: string, messageId: string) => {
  const upvotePromise = voteMessage(chatId, messageId, "up");

  toast.promise(upvotePromise, {
    loading: "좋은 응답으로 저장중...",
    success: () => {
      // SWR 캐시 즉시 업데이트 (낙관적 업데이트)
      mutate<Array<Vote>>(
        `/api/vote?chatId=${chatId}`,
        (currentVotes) => {
          if (!currentVotes) return [];

          const votesWithoutCurrent = currentVotes.filter(
            (vote) => vote.messageId !== messageId
          );

          return [
            ...votesWithoutCurrent,
            { chatId, messageId, isUpvoted: true },
          ];
        },
        { revalidate: false }
      );

      return "좋은 응답으로 저장되었어요!";
    },
    error: "좋은 응답으로 저장하는데 실패했어요.",
  });
};
```

---

## 제안 API

### 제안 조회

**엔드포인트**: `GET /api/suggestions`

문서에 대한 AI 제안사항을 조회합니다.

**쿼리 파라미터**:

| 파라미터     | 타입   | 필수 | 설명           |
| ------------ | ------ | ---- | -------------- |
| `documentId` | string | 필수 | 문서 ID (UUID) |

**요청 본문**: 없음 (GET 요청)

**응답 본문**:

```typescript
// 성공 시
Array<{
  id: string;
  documentId: string;
  documentCreatedAt: string;
  originalText: string;
  suggestedText: string;
  description: string | null;
  isResolved: boolean;
  userId: string;
  createdAt: string;
}>

// 빈 배열 (제안이 없는 경우)
[]

// 실패 시
{
  error: string;
  code: string;
  cause?: string;
}
```

**권한**: 문서 소유자만 접근 가능

**클라이언트 사용 예시**:

```typescript
// 문서의 제안사항 조회
const getSuggestionsByDocumentId = async (documentId: string) => {
  try {
    const response = await fetch(`/api/suggestions?documentId=${documentId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch suggestions");
    }

    const suggestions = await response.json();
    console.log("Suggestions:", suggestions);
    return suggestions;
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    throw error;
  }
};

// SWR을 사용한 제안 조회
import useSWR from "swr";

const useSuggestions = (documentId: string) => {
  const { data, error, mutate } = useSWR(
    documentId ? `/api/suggestions?documentId=${documentId}` : null,
    fetcher
  );

  return {
    suggestions: data || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
};

// 제안사항 필터링 및 표시
const SuggestionsPanel = ({ documentId }: { documentId: string }) => {
  const { suggestions, isLoading } = useSuggestions(documentId);

  const unresolvedSuggestions = suggestions.filter((s) => !s.isResolved);
  const resolvedSuggestions = suggestions.filter((s) => s.isResolved);

  if (isLoading) return <div>Loading suggestions...</div>;

  return (
    <div>
      <h3>미해결 제안 ({unresolvedSuggestions.length})</h3>
      {unresolvedSuggestions.map((suggestion) => (
        <SuggestionItem key={suggestion.id} suggestion={suggestion} />
      ))}

      <h3>해결된 제안 ({resolvedSuggestions.length})</h3>
      {resolvedSuggestions.map((suggestion) => (
        <SuggestionItem key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
};
```

---

## 히스토리 API

### 채팅 히스토리 조회

**엔드포인트**: `GET /api/history`

사용자의 채팅 히스토리를 페이지네이션으로 조회합니다.

**쿼리 파라미터**:

| 파라미터         | 타입   | 필수 | 기본값 | 설명                                         |
| ---------------- | ------ | ---- | ------ | -------------------------------------------- |
| `limit`          | number | 선택 | 10     | 조회할 채팅 수 (1-100)                       |
| `starting_after` | string | 선택 | -      | 커서 기반 페이지네이션 - 이 ID 이후의 채팅들 |
| `ending_before`  | string | 선택 | -      | 커서 기반 페이지네이션 - 이 ID 이전의 채팅들 |

**제한사항**: `starting_after`와 `ending_before`는 동시 사용 불가

**요청 본문**: 없음 (GET 요청)

**응답 본문**:

```typescript
// 성공 시
{
  chats: Array<{
    id: string;
    createdAt: string;
    title: string;
    userId: string;
    visibility: 'public' | 'private';
  }>;
  hasMore: boolean; // 다음 페이지 존재 여부
}

// 실패 시
{
  error: string;
  code: string;
  cause?: string;
}
```

**권한**: 로그인한 사용자만 접근 가능 (자신의 채팅만 조회)

**클라이언트 사용 예시**:

```typescript
// components/sidebar-history.tsx에서 무한 스크롤 구현
import useSWRInfinite from "swr/infinite";

const PAGE_SIZE = 10;

// 페이지네이션 키 생성 함수
export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory
) {
  // 이전 페이지 데이터가 있고 hasMore가 false면 더 이상 로드하지 않음
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  // 첫 페이지
  if (pageIndex === 0) return `/api/history?limit=${PAGE_SIZE}`;

  // 다음 페이지 (커서 기반)
  const lastChatFromPage = previousPageData.chats.at(-1);
  if (!lastChatFromPage) return null;

  return `/api/history?ending_before=${lastChatFromPage.id}&limit=${PAGE_SIZE}`;
}

// 무한 스크롤 훅
const useChatHistory = () => {
  const {
    data: paginatedChatHistories,
    error,
    size,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
  });

  // 모든 페이지의 채팅을 하나의 배열로 합침
  const chats = paginatedChatHistories
    ? paginatedChatHistories.flatMap((page) => page.chats)
    : [];

  // 더 로드할 수 있는지 확인
  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  const isEmpty = paginatedChatHistories?.[0]?.chats.length === 0;

  return {
    chats,
    error,
    isLoading,
    isValidating,
    isEmpty,
    hasReachedEnd,
    loadMore: () => setSize(size + 1),
    mutate,
  };
};

// 컴포넌트에서 사용
const SidebarHistory = () => {
  const { chats, isLoading, isEmpty, hasReachedEnd, loadMore } =
    useChatHistory();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // 스크롤이 끝에 도달하면 더 로드
    if (scrollHeight - scrollTop === clientHeight && !hasReachedEnd) {
      loadMore();
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isEmpty) return <div>No chats found</div>;

  return (
    <div
      onScroll={handleScroll}
      style={{ maxHeight: "400px", overflow: "auto" }}
    >
      {chats.map((chat) => (
        <ChatItem key={chat.id} chat={chat} />
      ))}
      {!hasReachedEnd && <div>Loading more...</div>}
    </div>
  );
};
```

---

## 에러 처리

모든 API는 `ChatSDKError` 클래스를 사용한 일관된 에러 처리를 제공합니다.

### 에러 코드

| 에러 코드              | 설명               | HTTP 상태 코드 | 발생 상황                                   |
| ---------------------- | ------------------ | -------------- | ------------------------------------------- |
| `bad_request:api`      | 잘못된 요청        | 400            | 필수 파라미터 누락, 잘못된 데이터 형식      |
| `bad_request:database` | 데이터베이스 오류  | 400            | DB 쿼리 실행 실패, 데이터 제약조건 위반     |
| `unauthorized:*`       | 인증 필요          | 401            | 로그인하지 않은 상태에서 보호된 리소스 접근 |
| `forbidden:*`          | 권한 없음          | 403            | 리소스 소유자가 아닌 사용자의 접근 시도     |
| `not_found:*`          | 리소스 없음        | 404            | 존재하지 않는 채팅, 문서, 메시지 등         |
| `rate_limit:*`         | 사용량 제한 초과   | 429            | 일일 메시지 제한 초과                       |
| `offline:chat`         | 네트워크 연결 없음 | -              | 클라이언트 네트워크 연결 끊김               |

### 클라이언트 에러 처리

```typescript
// lib/utils.ts의 공통 fetch 함수
export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

// 네트워크 상태 확인
export async function fetchWithErrorHandlers(input, init?) {
  try {
    const response = await fetch(input, init);
    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }
    return response;
  } catch (error) {
    if (!navigator.onLine) {
      throw new ChatSDKError("offline:chat");
    }
    throw error;
  }
}
```

---

## 인증 및 권한

### 세션 확인

모든 보호된 API는 `auth()` 함수를 통해 세션을 확인합니다:

```typescript
const session = await auth();
if (!session?.user) {
  return new ChatSDKError("unauthorized:*").toResponse();
}
```

### 리소스 소유권 확인

사용자는 자신이 소유한 리소스에만 접근할 수 있습니다:

```typescript
if (chat.userId !== session.user.id) {
  return new ChatSDKError("forbidden:*").toResponse();
}
```

### 사용량 제한

사용자 타입별로 일일 메시지 제한이 적용됩니다:

```typescript
const messageCount = await getMessageCountByUserId({
  id: session.user.id,
  differenceInHours: 24,
});

if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
  return new ChatSDKError("rate_limit:chat").toResponse();
}
```

---

## 실시간 기능

### Server-Sent Events (SSE)

채팅 API는 SSE를 통한 실시간 스트리밍을 지원합니다:

```typescript
// 스트림 변환
return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
```

### 재개 가능한 스트림

Redis를 통한 스트림 재개 기능:

```typescript
const streamContext = getStreamContext();
if (streamContext) {
  return new Response(
    await streamContext.resumableStream(streamId, () => stream)
  );
}
```

---

## 데이터베이스 스키마

주요 데이터 모델:

### Chat 테이블

| 필드명       | 타입     | 설명                              |
| ------------ | -------- | --------------------------------- |
| `id`         | UUID     | 채팅 고유 식별자                  |
| `userId`     | String   | 채팅 소유자 ID                    |
| `title`      | String   | 채팅 제목                         |
| `visibility` | Enum     | 공개 설정 ('public' \| 'private') |
| `createdAt`  | DateTime | 채팅 생성 시간                    |

### Message 테이블

| 필드명        | 타입     | 설명                                |
| ------------- | -------- | ----------------------------------- |
| `id`          | UUID     | 메시지 고유 식별자                  |
| `chatId`      | UUID     | 소속 채팅 ID (외래키)               |
| `role`        | Enum     | 메시지 역할 ('user' \| 'assistant') |
| `parts`       | JSON     | 메시지 내용 (텍스트/파일 배열)      |
| `attachments` | JSON     | 첨부파일 정보                       |
| `createdAt`   | DateTime | 메시지 생성 시간                    |

### Vote 테이블

| 필드명      | 타입    | 설명                                      |
| ----------- | ------- | ----------------------------------------- |
| `chatId`    | UUID    | 채팅 ID (외래키)                          |
| `messageId` | UUID    | 투표 대상 메시지 ID (외래키)              |
| `isUpvoted` | Boolean | 좋아요 여부 (true: 좋아요, false: 싫어요) |

### Document 테이블

| 필드명      | 타입     | 설명                                               |
| ----------- | -------- | -------------------------------------------------- |
| `id`        | UUID     | 문서 고유 식별자                                   |
| `userId`    | String   | 문서 소유자 ID                                     |
| `title`     | String   | 문서 제목                                          |
| `content`   | Text     | 문서 내용                                          |
| `kind`      | Enum     | 문서 타입 ('text' \| 'code' \| 'image' \| 'sheet') |
| `createdAt` | DateTime | 문서 생성/수정 시간                                |

### User 테이블

| 필드명      | 타입     | 설명                    |
| ----------- | -------- | ----------------------- |
| `id`        | String   | 사용자 고유 식별자      |
| `email`     | String   | 사용자 이메일           |
| `name`      | String   | 사용자 이름             |
| `type`      | Enum     | 사용자 타입 (권한 레벨) |
| `createdAt` | DateTime | 계정 생성 시간          |

### Suggestion 테이블

| 필드명       | 타입     | 설명                  |
| ------------ | -------- | --------------------- |
| `id`         | UUID     | 제안 고유 식별자      |
| `documentId` | UUID     | 대상 문서 ID (외래키) |
| `userId`     | String   | 제안 소유자 ID        |
| `content`    | Text     | 제안 내용             |
| `createdAt`  | DateTime | 제안 생성 시간        |

---

이 문서는 Next.js AI Chatbot의 모든 API 엔드포인트에 대한 완전한 참조 가이드입니다. 각 API의 상세한 구현은 해당 라우트 파일에서 확인할 수 있습니다.
