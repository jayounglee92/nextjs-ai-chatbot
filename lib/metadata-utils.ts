import type { Metadata, ResolvingMetadata } from 'next'
import { getPostById } from '@/lib/db/queries'

interface GenerateMetadataParams {
  id: string
  parent: ResolvingMetadata
  pageType: 'ai-use-case' | 'news-letter' | 'learning-center'
}

const pageTypeLabels = {
  'ai-use-case': 'AI 활용 사례',
  'news-letter': '뉴스레터',
  'learning-center': '학습센터',
}

export async function generatePostMetadata({
  id,
  parent,
  pageType,
}: GenerateMetadataParams): Promise<Metadata> {
  const parentMetadata = await parent
  let postData = null

  try {
    postData = await getPostById({ id })
  } catch (error) {
    console.error(`Failed to fetch ${pageType} data:`, error)
    postData = null
  }

  const label = pageTypeLabels[pageType]

  return {
    title: postData?.title
      ? `DW AI 플랫폼 | ${label} | ${postData.title}`
      : `DW AI 플랫폼 | ${label}`,
    description: postData?.summary
      ? `${postData.summary.slice(0, 100)}...`
      : `DW AI 플랫폼 | ${label}`,
    openGraph: {
      title: postData?.title
        ? `DW AI 플랫폼 | ${label} | ${postData.title}`
        : `DW AI 플랫폼 | ${label}`,
      description: postData?.summary
        ? `${postData.summary.slice(0, 100)}...`
        : `DW AI 플랫폼 | ${label}`,
      images: postData?.thumbnailUrl ?? parentMetadata.openGraph?.images,
    },
    twitter: {
      title: postData?.title
        ? `DW AI 플랫폼 | ${label} | ${postData.title}`
        : `DW AI 플랫폼 | ${label}`,
      description: postData?.summary
        ? `${postData.summary.slice(0, 100)}...`
        : `DW AI 플랫폼 | ${label}`,
      images: postData?.thumbnailUrl ?? parentMetadata.openGraph?.images,
    },
  }
}

interface GenerateEditMetadataParams {
  id: string
  parent: ResolvingMetadata
  pageType: 'ai-use-case' | 'news-letter' | 'learning-center'
}

export async function generateEditMetadata({
  id,
  parent,
  pageType,
}: GenerateEditMetadataParams): Promise<Metadata> {
  const parentMetadata = await parent
  const previousImages = parentMetadata.openGraph?.images || []
  let postData = null

  try {
    postData = await getPostById({ id })
  } catch (error) {
    console.error(`Failed to fetch ${pageType} data for edit metadata:`, error)
    postData = null
  }

  const label = pageTypeLabels[pageType]

  return {
    title: postData?.title
      ? `DW AI 플랫폼 | ${label} 수정 | ${postData.title}`
      : `DW AI 플랫폼 | ${label} 수정`,
    description: postData?.summary
      ? `${postData.summary.slice(0, 100)}...`
      : `DW AI 플랫폼 | ${label}을 수정합니다.`,
    openGraph: {
      title: postData?.title
        ? `DW AI 플랫폼 | ${label} 수정 | ${postData.title}`
        : `DW AI 플랫폼 | ${label} 수정`,
      description: postData?.summary
        ? `${postData.summary.slice(0, 100)}...`
        : `DW AI 플랫폼 | ${label}을 수정합니다.`,
      images: previousImages,
    },
    twitter: {
      title: postData?.title
        ? `DW AI 플랫폼 | ${label} 수정 | ${postData.title}`
        : `DW AI 플랫폼 | ${label} 수정`,
      description: postData?.summary
        ? `${postData.summary.slice(0, 100)}...`
        : `DW AI 플랫폼 | ${label}을 수정합니다.`,
      images: previousImages,
    },
  }
}
