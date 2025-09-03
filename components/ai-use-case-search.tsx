'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  placeholder?: string
  basePath?: string
  searchParamName?: string
  pageParamName?: string
  className?: string
}

export function SearchBar({
  placeholder = '검색하세요...',
  basePath = '/',
  searchParamName = 'search',
  pageParamName = 'page',
  className = '',
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')

  // URL에서 검색어 읽기
  useEffect(() => {
    const searchWord = searchParams.get(searchParamName)
    if (searchWord) {
      setSearchTerm(searchWord)
    }
  }, [searchParams, searchParamName])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)

    if (searchTerm.trim()) {
      // 검색어가 있으면 search 파라미터 추가, 페이지는 1로 리셋
      params.set(searchParamName, searchTerm.trim())
      params.set(pageParamName, '1')
    } else {
      // 검색어가 없으면 search 파라미터 제거
      params.delete(searchParamName)
      params.set(pageParamName, '1')
    }

    const queryString = params.toString()
    const url = queryString ? `${basePath}?${queryString}` : basePath
    router.push(url)
  }

  const handleClear = () => {
    setSearchTerm('')
    const params = new URLSearchParams(searchParams)
    params.delete(searchParamName)
    params.set(pageParamName, '1')

    const queryString = params.toString()
    const url = queryString ? `${basePath}?${queryString}` : basePath
    router.push(url)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          className="px-10 h-10"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 size-8 p-0 hover:bg-muted"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </form>
  )
}
