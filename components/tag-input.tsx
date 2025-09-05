'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { XIcon } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  maxTags?: number
  label?: string
  placeholder?: string
  className?: string
}

const DEFAULT_MAX_TAGS = 10

export function TagInput({
  tags,
  onTagsChange,
  maxTags = DEFAULT_MAX_TAGS,
  label = '태그',
  placeholder = '태그입력',
  className = '',
}: TagInputProps) {
  const [tagInput, setTagInput] = React.useState('')

  // 태그 추가
  const addTag = React.useCallback(() => {
    let trimmedTag = tagInput.trim()

    // 맨 앞의 모든 # 제거
    trimmedTag = trimmedTag.replace(/^#+/, '').trim()

    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onTagsChange([...tags, trimmedTag])
      setTagInput('')
    }
  }, [tagInput, tags, maxTags, onTagsChange])

  // 태그 제거
  const removeTag = React.useCallback(
    (tagToRemove: string) => {
      onTagsChange(tags.filter((tag) => tag !== tagToRemove))
    },
    [tags, onTagsChange],
  )

  // Enter 키 핸들러
  const handleTagInputKeyUp = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        addTag()
      }
    },
    [addTag],
  )

  return (
    <div className={className}>
      <Label className="text-sm font-medium">{label}</Label>

      {/* 태그 입력 필드 */}
      <div className="mt-1 flex gap-2">
        <Input
          type="text"
          placeholder={placeholder}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyUp={handleTagInputKeyUp}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={addTag}
          disabled={!tagInput.trim() || tags.length >= maxTags}
        >
          추가
        </Button>
      </div>

      {/* 태그 뱃지들 */}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="inline-flex items-center pl-3 pr-2 py-1 bg-gray-100 border border-dashed border-gray-300 text-sm"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 size-4 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-700"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {tags.length >= maxTags && (
        <p className="mt-2 text-sm text-red-600">
          최대 {maxTags}개의 태그까지 추가할 수 있습니다.
        </p>
      )}
    </div>
  )
}
