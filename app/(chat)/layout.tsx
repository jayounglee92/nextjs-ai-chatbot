import { cookies } from 'next/headers'

import { DepthSidebar } from '@/components/depth-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { auth } from '../(auth)/auth'
import Script from 'next/script'
import { DataStreamProvider } from '@/components/data-stream-provider'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DW AI 플랫폼 | AI 채팅',
  description:
    'DW AI 플랫폼의 AI 채팅 기능을 통해 다양한 질문과 업무를 도와드립니다. 실시간 대화형 AI 어시스턴트를 경험해보세요.',
  openGraph: {
    title: 'DW AI 플랫폼 | AI 채팅',
    description:
      'DW AI 플랫폼의 AI 채팅 기능을 통해 다양한 질문과 업무를 도와드립니다. 실시간 대화형 AI 어시스턴트를 경험해보세요.',
    type: 'website',
  },
  twitter: {
    title: 'DW AI 플랫폼 | AI 채팅',
    description:
      'DW AI 플랫폼의 AI 채팅 기능을 통해 다양한 질문과 업무를 도와드립니다. 실시간 대화형 AI 어시스턴트를 경험해보세요.',
    card: 'summary_large_image',
  },
}

export const experimental_ppr = true

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()])
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true'
  console.log(session)
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <DepthSidebar user={session?.user} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  )
}
