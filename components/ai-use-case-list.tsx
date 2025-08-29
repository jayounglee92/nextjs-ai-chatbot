'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { Pagination } from '@/components/pagination'

interface AiUseCase {
  id: string
  title: string
  readingTime: string
  publicationDate: string
  description: string
  author: string
  thumbnail: string
}

interface AiUseCaseListProps {
  useCases: AiUseCase[]
  totalItems: number
  itemsPerPage: number
  currentPage: number
}

export function AiUseCaseList({
  useCases,
  totalItems,
  itemsPerPage,
  currentPage,
}: AiUseCaseListProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {useCases.map((useCase) => (
          <Link href={`/ai-use-case/${useCase.id}`} key={useCase.id}>
            <Card className="shadow-none">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground leading-tight line-clamp-2 md:line-clamp-1">
                        {useCase.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{useCase.readingTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{useCase.publicationDate}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 h-12">
                      {useCase.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {useCase.author}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 h-24 w-24 md:h-28 md:w-28 bg-muted rounded-lg overflow-hidden">
                    {useCase.thumbnail && (
                      <Image
                        src={useCase.thumbnail}
                        alt={useCase.title}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 페이지네이션 */}
      <Pagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
      />
    </div>
  )
}
