import Image from 'next/image'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NewsItem {
  id: string
  title: string
  description: string
  image: string
  category: string
  publishedAt: string
  sourceCount: number
}

interface WideArticleProps {
  item: NewsItem
  isWideRight?: boolean
}

interface ThreeColumnArticleProps {
  item: NewsItem
}

interface NewsListProps {
  newsData: NewsItem[]
}

export function WideArticle({ item, isWideRight = false }: WideArticleProps) {
  return (
    <article
      className={cn(
        'md:py-4 border rounded-lg md:rounded-none md:border-x-0 group cursor-pointer transition-transform overflow-hidden bg-white col-span-12',
        isWideRight ? 'md:border-t-0' : '',
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
        {/* 콘텐츠 */}
        <div
          className={`p-4 md:p-6 order-2 md:col-span-3 ${isWideRight ? 'md:order-2' : 'md:order-1'}`}
        >
          <div className="flex flex-col h-full">
            <h3 className="font-semibold text-gray-900 mb-3 text-base md:text-xl group-hover:text-amber-600 transition-colors">
              {item.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 hidden md:block ">
              {item.description}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="size-3" />
                <span>{item.publishedAt}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 이미지 */}
        <div
          className={`relative overflow-hidden h-48 md:h-60 rounded-lg md:col-span-2 ${isWideRight ? 'md:order-1' : 'md:order-2'}`}
        >
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full">
              {item.category}
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}

export function ThreeColumnArticle({ item }: ThreeColumnArticleProps) {
  return (
    <article className="group border rounded-lg cursor-pointer transition-transform overflow-hidden bg-white col-span-12 md:col-span-4">
      <div className="flex flex-col">
        {/* 이미지 */}
        <div className="relative rounded-lg overflow-hidden h-48">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full">
              {item.category}
            </span>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>{item.publishedAt}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export function NewsList({ newsData }: NewsListProps) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* 첫 번째 아이템 - Wide (글 왼쪽, 그림 오른쪽) */}
      {newsData[0] && <WideArticle key={newsData[0].id} item={newsData[0]} />}

      {/* 나머지 아이템들 - 3,2,3,2 패턴 */}
      {newsData.slice(1).map((item, index) => {
        const position = index % 5 // 0,1,2,3,4 반복
        const isWide = position === 3 || position === 4 // 2줄 그리드
        const isWideRight = position === 4 // 4번째 (2줄 그리드 - 글 오른쪽, 그림 왼쪽)
        const isThreeColumn = position === 0 || position === 1 || position === 2 // 0,1,2번째 (3줄 그리드)

        if (isWide) {
          return (
            <WideArticle key={item.id} item={item} isWideRight={isWideRight} />
          )
        }

        if (isThreeColumn) {
          return <ThreeColumnArticle key={item.id} item={item} />
        }

        return null
      })}
    </div>
  )
}
