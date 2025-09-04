'use client'

import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/youtube-utils'

// YouTube ID 없음 상태
export function YoutubeIdEmptyState() {
  return (
    <div className="size-full flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-400">
        <p className="text-sm">비디오 미리보기를 확인하려면</p>
        <p className="text-sm">유효한 YouTube 비디오 ID를 입력해주세요</p>
      </div>
    </div>
  )
}

// 에러 상태
interface YoutubeErrorStateProps {
  error: string
}

export function YoutubeErrorState({ error }: YoutubeErrorStateProps) {
  return (
    <div className="size-full flex items-center justify-center bg-red-50">
      <div className="text-center text-red-500">
        <p className="text-sm font-medium">비디오 ID 오류</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    </div>
  )
}

// 로딩 상태
export function YoutubeLoadingState() {
  return (
    <div className="size-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full size-8 border-b-2 border-blue-600 mx-auto mb-2" />
        <p className="text-sm text-gray-600">비디오 확인 중...</p>
      </div>
    </div>
  )
}

// YouTube 비디오 존재 상태
interface YoutubeExistsStateProps {
  videoId: string
}

export function YoutubeExistsState({ videoId }: YoutubeExistsStateProps) {
  return (
    <iframe
      src={getYouTubeEmbedUrl(videoId)}
      title="YouTube 비디오 미리보기"
      className="size-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}

// YouTube 비디오 존재하지 않음 상태
interface YoutubeNotExistsStateProps {
  videoId: string
}

export function YoutubeNotExistsState({ videoId }: YoutubeNotExistsStateProps) {
  return (
    <div className="size-full flex items-center justify-center bg-gray-100">
      <div className="text-center text-gray-500">
        <p className="text-lg font-medium">비디오를 불러올 수 없습니다</p>
        <p className="text-sm mt-1">
          올바른 YouTube 비디오 ID인지 확인해주세요
        </p>
        <p className="text-xs mt-2 text-gray-400">비디오 ID: {videoId}</p>
      </div>
    </div>
  )
}

// YouTube 비디오 정보 (썸네일 + ID)
interface YoutubeInfoProps {
  videoId: string
}

export function YoutubeInfo({ videoId }: YoutubeInfoProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <img
        src={getYouTubeThumbnailUrl(videoId, 'default')}
        alt="비디오 썸네일"
        className="size-12 rounded object-cover"
      />
      <div>
        <p className="font-medium">YouTube 비디오</p>
        <p>ID: {videoId}</p>
      </div>
    </div>
  )
}
