'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  isValidYouTubeVideoIdFormat,
  checkVideoExistsViaIframe,
} from '@/lib/youtube-utils'

interface UseYoutubeVideoReturn {
  videoId: string
  setVideoId: (videoId: string) => void
  videoIdError: string | null
  isCheckingVideo: boolean
  videoExists: boolean | null
  handleVideoIdChange: (value: string) => void
}

export function useYoutubeVideo(): UseYoutubeVideoReturn {
  const [videoId, setVideoId] = useState('')
  const [videoIdError, setVideoIdError] = useState<string | null>(null)
  const [isCheckingVideo, setIsCheckingVideo] = useState(false)
  const [videoExists, setVideoExists] = useState<boolean | null>(null)

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleVideoIdChange = useCallback(async (value: string) => {
    setVideoId(value)
    setVideoExists(null)

    // 이전 디바운스 타이머 클리어
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // 빈 값이면 에러 상태 초기화
    if (!value.trim()) {
      setVideoIdError(null)
      return
    }

    // 즉시 형식 검증
    if (!isValidYouTubeVideoIdFormat(value)) {
      setVideoIdError(
        '올바른 YouTube 비디오 ID를 입력해주세요. (예: dQw4w9WgXcQ)',
      )
      return
    }

    // 형식이 올바르면 에러 초기화
    setVideoIdError(null)

    // 디바운스 적용 (500ms 후에 실제 검증)
    debounceTimeoutRef.current = setTimeout(async () => {
      setIsCheckingVideo(true)
      try {
        const exists = await checkVideoExistsViaIframe(value)
        setVideoExists(exists)
        if (!exists) {
          setVideoIdError('이 동영상은 볼 수 없습니다.')
        }
      } catch (error) {
        console.error('비디오 존재 여부 확인 중 오류:', error)
        setVideoExists(false)
        setVideoIdError('비디오 확인 중 오류가 발생했습니다.')
      } finally {
        setIsCheckingVideo(false)
      }
    }, 500)
  }, [])

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    videoId,
    setVideoId,
    videoIdError,
    isCheckingVideo,
    videoExists,
    handleVideoIdChange,
  }
}
