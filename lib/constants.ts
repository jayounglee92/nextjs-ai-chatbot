import localFont from 'next/font/local'
import { generateDummyPassword } from './db/utils'

export const isProductionEnvironment = process.env.NODE_ENV === 'production'
export const isDevelopmentEnvironment = process.env.NODE_ENV === 'development'
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT,
)

export const guestRegex = /^guest-\d+$/

export const DUMMY_PASSWORD = generateDummyPassword()

export const pretendard = localFont({
  src: [
    {
      path: '../public/fonts/Pretendard-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../public/fonts/Pretendard-ExtraLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '../public/fonts/Pretendard-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Pretendard-Regular.woff2',
      weight: '400',
      style: 'normal',
    },

    {
      path: '../public/fonts/Pretendard-Medium.woff2',
      weight: '500',
      style: 'normal',
    },

    {
      path: '../public/fonts/Pretendard-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },

    {
      path: '../public/fonts/Pretendard-Bold.woff2',
      weight: '700',
      style: 'normal',
    },

    {
      path: '../public/fonts/Pretendard-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },

    {
      path: '../public/fonts/Pretendard-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-pretendard',
})
