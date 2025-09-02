'use client'

import * as React from 'react'
import { Button } from '@/components/tiptap-ui-primitive/button'
import { CloseIcon } from '@/components/tiptap-icons/close-icon'
import {
  useFileUpload,
  type UploadOptions,
} from '@/components/tiptap-node/image-upload-node/image-upload-node'

const CloudUploadIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.1953 4.41771C10.3478 4.08499 9.43578 3.94949 8.5282 4.02147C7.62062 4.09345 6.74133 4.37102 5.95691 4.83316C5.1725 5.2953 4.50354 5.92989 4.00071 6.68886C3.49788 7.44783 3.17436 8.31128 3.05465 9.2138C2.93495 10.1163 3.0222 11.0343 3.3098 11.8981C3.5974 12.7619 4.07781 13.5489 4.71463 14.1995C5.10094 14.5942 5.09414 15.2274 4.69945 15.6137C4.30476 16 3.67163 15.9932 3.28532 15.5985C2.43622 14.731 1.79568 13.6816 1.41221 12.5299C1.02875 11.3781 0.91241 10.1542 1.07201 8.95084C1.23162 7.74748 1.66298 6.59621 2.33343 5.58425C3.00387 4.57229 3.89581 3.72617 4.9417 3.10998C5.98758 2.4938 7.15998 2.1237 8.37008 2.02773C9.58018 1.93176 10.7963 2.11243 11.9262 2.55605C13.0561 2.99968 14.0703 3.69462 14.8919 4.58825C15.5423 5.29573 16.0585 6.11304 16.4177 7.00002H17.4999C18.6799 6.99991 19.8288 7.37933 20.7766 8.08222C21.7245 8.78515 22.4212 9.7743 22.7637 10.9036C23.1062 12.0328 23.0765 13.2423 22.6788 14.3534C22.2812 15.4644 21.5367 16.4181 20.5554 17.0736C20.0962 17.3803 19.4752 17.2567 19.1684 16.7975C18.8617 16.3382 18.9853 15.7172 19.4445 15.4105C20.069 14.9934 20.5427 14.3865 20.7958 13.6794C21.0488 12.9724 21.0678 12.2027 20.8498 11.4841C20.6318 10.7655 20.1885 10.136 19.5853 9.6887C18.9821 9.24138 18.251 8.99993 17.5001 9.00002H15.71C15.2679 9.00002 14.8783 8.70973 14.7518 8.28611C14.4913 7.41374 14.0357 6.61208 13.4195 5.94186C12.8034 5.27164 12.0427 4.75043 11.1953 4.41771Z"
      fill="currentColor"
    />
    <path
      d="M11 14.4142V21C11 21.5523 11.4477 22 12 22C12.5523 22 13 21.5523 13 21V14.4142L15.2929 16.7071C15.6834 17.0976 16.3166 17.0976 16.7071 16.7071C17.0976 16.3166 17.0976 15.6834 16.7071 15.2929L12.7078 11.2936C12.7054 11.2912 12.703 11.2888 12.7005 11.2864C12.5208 11.1099 12.2746 11.0008 12.003 11L12 11L11.997 11C11.8625 11.0004 11.7343 11.0273 11.6172 11.0759C11.502 11.1236 11.3938 11.1937 11.2995 11.2864C11.297 11.2888 11.2946 11.2912 11.2922 11.2936L7.29289 15.2929C6.90237 15.6834 6.90237 16.3166 7.29289 16.7071C7.68342 17.0976 8.31658 17.0976 8.70711 16.7071L11 14.4142Z"
      fill="currentColor"
    />
  </svg>
)

interface ThumbnailUploadProps {
  /**
   * 업로드된 이미지 URL
   */
  imageUrl?: string
  /**
   * 이미지 URL이 변경될 때 호출되는 콜백
   */
  onImageChange: (url: string | null) => void
  /**
   * 업로드 옵션
   */
  uploadOptions: UploadOptions
}

/**
 * 썸네일 이미지 업로드 컴포넌트
 * 하나의 이미지만 업로드 가능하며, 새로운 이미지 업로드 시 기존 이미지를 대체
 */
export const ThumbnailUpload: React.FC<ThumbnailUploadProps> = ({
  imageUrl,
  onImageChange,
  uploadOptions,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = React.useState(false)

  const { fileItems, uploadFiles, removeFileItem, clearAllFiles } =
    useFileUpload({
      ...uploadOptions,
      limit: 1, // 하나의 이미지만 허용
      onSuccess: (url) => {
        onImageChange(url)
        uploadOptions.onSuccess?.(url)
      },
      onError: (error) => {
        uploadOptions.onError?.(error)
      },
    })

  const handleFileSelect = async (files: File[]) => {
    // 기존 파일이 있으면 먼저 제거
    if (fileItems.length > 0) {
      clearAllFiles()
    }
    if (imageUrl) {
      onImageChange(null)
    }

    // 새 파일 업로드
    await uploadFiles(files)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    handleFileSelect(Array.from(files))
  }

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.click()
    }
  }

  const handleRemove = () => {
    if (fileItems.length > 0) {
      clearAllFiles()
    }
    onImageChange(null)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const hasImage = imageUrl !== undefined
  const currentFileItem = fileItems[0]

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className={`
         relative border-2 border-dashed rounded-lg p-4 transition-colors
          ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${hasImage ? 'cursor-pointer' : 'cursor-pointer hover:border-gray-400'}
        `}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {!hasImage ? (
          // 업로드 영역
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CloudUploadIcon />
            </div>
            <p className="text-xs text-gray-600 mb-2 break-keep">
              <em>클릭하거나</em> 드래그 앤 드롭하여 썸네일 이미지를
              업로드하세요
            </p>
            <p className="text-xs text-gray-500">
              1개, 최대 {uploadOptions.maxSize / 1024 / 1024}MB
            </p>
          </div>
        ) : (
          // 이미지 미리보기
          <div className="relative">
            {currentFileItem && currentFileItem.status === 'uploading' ? (
              // 업로드 중
              <div className="relative">
                <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      업로드 중... {currentFileItem.progress}%
                    </p>
                  </div>
                </div>
                <div
                  className="absolute bottom-0 left-0 h-1 bg-blue-600 transition-all duration-300"
                  style={{ width: `${currentFileItem.progress}%` }}
                />
              </div>
            ) : (
              // 업로드 완료된 이미지
              <div className="relative h-48 w-48">
                <img
                  src={imageUrl || currentFileItem?.url}
                  alt="썸네일"
                  className="w-full h-full object-cover rounded-lg"
                />

                <Button
                  type="button"
                  //   data-style="ghost"
                  className="absolute top-1 right-1 !rounded-full !bg-white/50 !hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                >
                  <CloseIcon className="w-4 h-4 text-gray-600" />
                </Button>
              </div>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={uploadOptions.accept}
          onChange={handleInputChange}
          onClick={(e) => e.stopPropagation()}
          className="hidden"
        />
      </div>
    </div>
  )
}
