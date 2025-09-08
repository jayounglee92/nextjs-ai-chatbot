import { cookies } from 'next/headers'

import { Chat } from '@/components/chat'
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models'
import { generateUUID } from '@/lib/utils'
import { DataStreamHandler } from '@/components/data-stream-handler'
import { auth } from '../(auth)/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth()

  // 세션이 없으면 게스트 로그인 페이지로 리다이렉트
  if (!session) {
    redirect('/login')
  }

  const id = generateUUID()

  const cookieStore = await cookies()
  const modelIdFromCookie = cookieStore.get('chat-model')

  // 쿠키에 저장된 모델이 없으면 기본 모델로 설정
  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    )
  }

  // 쿠키에 저장된 모델이 있으면 해당 모델로 설정
  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  )
}
