import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface BreadcrumbItemData {
  label: string
  href?: string
}

interface PageBreadcrumbProps {
  items: BreadcrumbItemData[]
  className?: string
}

export function PageBreadcrumb({ items, className = '' }: PageBreadcrumbProps) {
  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => (
          <BreadcrumbItem key={`${item.label}-${index}`}>
            {index === items.length - 1 ? (
              <BreadcrumbPage>
                {item.href ? (
                  <Link href={item.href || '#'}>{item.label}</Link>
                ) : (
                  item.label
                )}
              </BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link href={item.href || '#'}>{item.label}</Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
