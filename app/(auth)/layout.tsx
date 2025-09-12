import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DW AI 플랫폼 | 로그인',
  description:
    'DW AI 플랫폼에 로그인하여 AI 기술을 활용한 업무 효율성을 높여보세요. 사내 통합 계정으로 간편하게 로그인할 수 있습니다.',
  keywords: [
    'DW AI 플랫폼',
    '로그인',
    'AI 기술',
    '업무 효율성',
    '사내 통합 계정',
  ],
  openGraph: {
    title: 'DW AI 플랫폼 | 로그인',
    description:
      'DW AI 플랫폼에 로그인하여 AI 기술을 활용한 업무 효율성을 높여보세요. 사내 통합 계정으로 간편하게 로그인할 수 있습니다.',
    type: 'website',
  },
  twitter: {
    title: 'DW AI 플랫폼 | 로그인',
    description:
      'DW AI 플랫폼에 로그인하여 AI 기술을 활용한 업무 효율성을 높여보세요. 사내 통합 계정으로 간편하게 로그인할 수 있습니다.',
    card: 'summary_large_image',
  },
  robots: {
    index: false, // 로그인 페이지는 검색엔진에서 제외
    follow: false,
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
