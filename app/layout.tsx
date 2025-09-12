import { Toaster } from 'sonner'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'

import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { pretendard } from '@/lib/fonts'

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.vercel.ai'), // TODO: 수정
  title: 'DW AI 플랫폼',
  description: 'DW AI 플랫폼 : 내/외부 기술 소통과 성장 플랫폼',
  openGraph: {
    title: 'DW AI 플랫폼',
    description: 'DW AI 플랫폼 : 내/외부 기술 소통과 성장 플랫폼',
    images: ['/images/og-image.png'],
  },
  twitter: {
    title: 'DW AI 플랫폼',
    description: 'DW AI 플랫폼 : 내/외부 기술 소통과 성장 플랫폼',
    images: ['/images/og-image.png'],
  },
}

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
}

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)'
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)'
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
      className={`${pretendard.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      {/* suppressHydrationWarning: 브라우저 확장프로그램으로 인한 하이드레이션 에러 방지 */}
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster position="top-center" />
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
