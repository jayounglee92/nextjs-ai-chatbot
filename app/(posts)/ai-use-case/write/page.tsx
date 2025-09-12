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
          { label: 'AI 활용 사례', href: '/ai-use-case' },
          { label: '작성하기' },
        ]}
      />

      <PostForm mode="create" postType="aiusecase" />
    </div>
  )
}
