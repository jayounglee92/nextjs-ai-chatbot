'use client'

import Image from 'next/image'
import { useMemo } from 'react'
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
export function YoutubeErrorState({ error }: { error: string }) {
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
        <div className="flex space-x-1 justify-center mb-4">
          <div className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s] [animation-duration:0.8s] [animation-timing-function:cubic-bezier(0.68,-0.55,0.265,1.55)]" />
          <div className="size-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s] [animation-duration:0.8s] [animation-timing-function:cubic-bezier(0.68,-0.55,0.265,1.55)]" />
          <div className="size-2 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-timing-function:cubic-bezier(0.68,-0.55,0.265,1.55)]" />
        </div>
        <p className="text-sm text-gray-600">비디오 확인 중...</p>
      </div>
    </div>
  )
}

// YouTube 비디오 존재 상태
export function YoutubeExistsState({ videoId }: { videoId: string }) {
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

export function YoutubeNotExistsState({ videoId }: { videoId: string }) {
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
export function YoutubeInfo({ videoId }: { videoId: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <Image
        src={getYouTubeThumbnailUrl(videoId, 'default')}
        alt="비디오 썸네일"
        className="size-12 rounded object-cover"
        width={48}
        height={48}
      />
      <div>
        <p className="font-medium">YouTube 비디오</p>
        <p>ID: {videoId}</p>
      </div>
    </div>
  )
}

interface YoutubePreviewProps {
  videoId: string
  videoIdError: string | null
  isCheckingVideo: boolean
  videoExists: boolean | null
}

type YoutubePreviewState =
  | 'empty'
  | 'error'
  | 'loading'
  | 'exists'
  | 'not-exists'
  | 'unknown'

const getYoutubePreviewState = (
  videoId: string,
  videoIdError: string | null,
  isCheckingVideo: boolean,
  videoExists: boolean | null,
): YoutubePreviewState => {
  if (!videoId) return 'empty'
  if (videoIdError) return 'error'
  if (isCheckingVideo) return 'loading'
  if (videoExists === true) return 'exists'
  if (videoExists === false) return 'not-exists'
  return 'unknown'
}

function renderYoutubePreviewContent(
  state: YoutubePreviewState,
  videoId: string,
  videoIdError: string | null,
) {
  const showVideoInfo = videoId && state === 'exists'

  return (
    <>
      <div className="aspect-video w-full max-w-md border border-gray-200 rounded-lg overflow-hidden">
        {(() => {
          switch (state) {
            case 'empty':
              return <YoutubeIdEmptyState />

            case 'error':
              return (
                <YoutubeErrorState error={videoIdError || '알 수 없는 오류'} />
              )

            case 'loading':
              return <YoutubeLoadingState />

            case 'exists':
              return <YoutubeExistsState videoId={videoId} />

            case 'not-exists':
              return <YoutubeNotExistsState videoId={videoId} />

            case 'unknown':
            default:
              return <YoutubeIdEmptyState />
          }
        })()}
      </div>
      {/* 비디오 정보 영역 - 고정 높이로 레이아웃 시프트 방지 */}
      <div className="h-12 flex items-center">
        {showVideoInfo ? (
          <YoutubeInfo videoId={videoId} />
        ) : (
          <div className="text-xs text-gray-400">
            비디오 정보가 여기에 표시됩니다
          </div>
        )}
      </div>
    </>
  )
}

export function YoutubePreview({
  videoId,
  videoIdError,
  isCheckingVideo,
  videoExists,
}: YoutubePreviewProps) {
  const state = useMemo(
    () =>
      getYoutubePreviewState(
        videoId,
        videoIdError,
        isCheckingVideo,
        videoExists,
      ),
    [videoId, videoIdError, isCheckingVideo, videoExists],
  )

  const previewContent = useMemo(
    () => renderYoutubePreviewContent(state, videoId, videoIdError),
    [state, videoId, videoIdError],
  )

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-sm font-medium text-gray-700">비디오 미리보기</h4>
      {previewContent}
    </div>
  )
}
