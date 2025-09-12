import { CommonHeader } from '@/components/common-header'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DW AI 플랫폼 | AI 활용 사례',
  description:
    'DW AI 플랫폼의 다양한 AI 활용 사례를 확인해보세요. 실제 업무에 적용할 수 있는 AI 솔루션과 활용 방법을 제공합니다.',
  openGraph: {
    title: 'DW AI 플랫폼 | AI 활용 사례',
    description:
      'DW AI 플랫폼의 다양한 AI 활용 사례를 확인해보세요. 실제 업무에 적용할 수 있는 AI 솔루션과 활용 방법을 제공합니다.',
  },
  twitter: {
    title: 'DW AI 플랫폼 | AI 활용 사례',
    description:
      'DW AI 플랫폼의 다양한 AI 활용 사례를 확인해보세요. 실제 업무에 적용할 수 있는 AI 솔루션과 활용 방법을 제공합니다.',
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
