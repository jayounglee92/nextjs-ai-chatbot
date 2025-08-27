'use client'

import { useSession } from 'next-auth/react'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'

export default function CommunityPage() {
  const { data: session, status } = useSession()

  if (!session) {
    return <div />
  }

  return (
    <div className="flex flex-col items-center justify-center ">
      <SimpleEditor />

      {/* <div className="border rounded-sm w-full max-w-3xl mx-auto px-4 py-8 my-16">
        <Tiptap />
      </div> */}
    </div>
  )
}
