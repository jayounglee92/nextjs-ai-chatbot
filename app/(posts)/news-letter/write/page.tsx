import { redirect } from 'next/navigation'
import { auth, USER_TYPES } from '@/app/(auth)/auth'
import { PageBreadcrumb } from '@/components/page-breadcrumb'
import { PostForm } from '@/components/post-form'

export default async function Page() {
  const session = await auth()

  if (!session?.user.types.includes(USER_TYPES.AI_ADMIN)) {
    redirect('/forbidden')
  }

  return (
    <div className="space-y-5">
      <PageBreadcrumb
        items={[
          { label: '뉴스레터', href: '/news-letter' },
          { label: '작성하기' },
        ]}
      />

      <PostForm mode="create" postType="news" />
    </div>
  )
}
