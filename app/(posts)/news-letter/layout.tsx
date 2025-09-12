import { CommonHeader } from '@/components/common-header'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DW AI 플랫폼 | 뉴스레터',
  description:
    'DW AI 플랫폼의 최신 뉴스레터를 확인해보세요. AI 기술 동향, 업계 소식, 실무 인사이트를 제공합니다.',
  openGraph: {
    title: 'DW AI 플랫폼 | 뉴스레터',
    description:
      'DW AI 플랫폼의 최신 뉴스레터를 확인해보세요. AI 기술 동향, 업계 소식, 실무 인사이트를 제공합니다.',
  },
  twitter: {
    title: 'DW AI 플랫폼 | 뉴스레터',
    description:
      'DW AI 플랫폼의 최신 뉴스레터를 확인해보세요. AI 기술 동향, 업계 소식, 실무 인사이트를 제공합니다.',
  },
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CommonHeader />
      <div className="p-3 md:p-8 mb-20">
        <div className="container mx-auto">{children}</div>
      </div>
    </>
  )
}
