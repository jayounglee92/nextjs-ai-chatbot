import { CommonHeader } from '@/components/common-header'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DW AI 플랫폼 | 학습센터',
  description:
    'DW AI 플랫폼의 학습센터에서 AI 기술을 배우고 실무에 적용해보세요. 체계적인 교육 과정과 실습 자료를 제공합니다.',
  openGraph: {
    title: 'DW AI 플랫폼 | 학습센터',
    description:
      'DW AI 플랫폼의 학습센터에서 AI 기술을 배우고 실무에 적용해보세요. 체계적인 교육 과정과 실습 자료를 제공합니다.',
  },
  twitter: {
    title: 'DW AI 플랫폼 | 학습센터',
    description:
      'DW AI 플랫폼의 학습센터에서 AI 기술을 배우고 실무에 적용해보세요. 체계적인 교육 과정과 실습 자료를 제공합니다.',
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
