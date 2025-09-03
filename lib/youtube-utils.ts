/**
 * YouTube 비디오 ID 유효성 검증 유틸리티
 */

// YouTube 비디오 ID 패턴 (11자리 영숫자와 하이픈, 언더스코어)
const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/

/**
 * YouTube 비디오 ID 형식이 올바른지 검증
 * @param videoId - 검증할 비디오 ID
 * @returns 형식이 올바르면 true, 그렇지 않으면 false
 */
export function isValidYouTubeVideoIdFormat(videoId: string): boolean {
  if (!videoId || typeof videoId !== 'string') {
    return false
  }

  return YOUTUBE_VIDEO_ID_PATTERN.test(videoId.trim())
}

/**
 * iframe을 통해 YouTube 비디오 존재 여부를 확인하는 Promise
 * @param videoId - 검증할 비디오 ID
 * @returns Promise<boolean> - 비디오가 존재하면 true, 그렇지 않으면 false
 */
export function checkVideoExistsViaIframe(videoId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isValidYouTubeVideoIdFormat(videoId)) {
      resolve(false)
      return
    }

    // 임시 iframe 생성
    const iframe = document.createElement('iframe')
    iframe.src = getYouTubeEmbedUrl(videoId)
    iframe.style.display = 'none'
    iframe.style.width = '1px'
    iframe.style.height = '1px'

    let resolved = false

    const cleanup = () => {
      if (resolved) return
      resolved = true
      document.body.removeChild(iframe)
    }

    // 성공적으로 로드되면 비디오가 존재
    iframe.onload = () => {
      cleanup()
      resolve(true)
    }

    // 에러가 발생하면 비디오가 존재하지 않음
    iframe.onerror = () => {
      cleanup()
      resolve(false)
    }

    // 타임아웃 설정 (5초)
    setTimeout(() => {
      cleanup()
      resolve(false)
    }, 5000)

    document.body.appendChild(iframe)
  })
}

/**
 * YouTube 비디오 썸네일 URL 생성
 * @param videoId - YouTube 비디오 ID
 * @param quality - 썸네일 품질 ('default', 'medium', 'high', 'standard', 'maxres')
 * @returns 썸네일 URL
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium',
): string {
  if (!isValidYouTubeVideoIdFormat(videoId)) {
    return ''
  }

  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/**
 * YouTube 비디오 임베드 URL 생성
 * @param videoId - YouTube 비디오 ID
 * @param options - 임베드 옵션
 * @returns 임베드 URL
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options: {
    autoplay?: boolean
    start?: number
    end?: number
    loop?: boolean
    controls?: boolean
    modestbranding?: boolean
  } = {},
): string {
  if (!isValidYouTubeVideoIdFormat(videoId)) {
    return ''
  }

  const params = new URLSearchParams()

  if (options.autoplay) params.set('autoplay', '1')
  if (options.start) params.set('start', options.start.toString())
  if (options.end) params.set('end', options.end.toString())
  if (options.loop) params.set('loop', '1')
  if (options.controls === false) params.set('controls', '0')
  if (options.modestbranding) params.set('modestbranding', '1')

  const queryString = params.toString()
  return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`
}
