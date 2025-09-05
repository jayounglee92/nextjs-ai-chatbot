import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import {
  getAllPosts,
  savePostWithContents,
  getPostById,
  updatePostContents,
  deletePostContentsById,
} from '@/lib/db/queries'
import { postContentsCreateSchema } from './schema'
import { postContentsUpdateSchema } from '@/lib/validators/post-contents'
import { ChatSDKError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // 특정 포스트 조회
    if (id) {
      const postData = await getPostById({ id })
      if (!postData) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json(postData)
    }

    // 포스트 목록 조회
    const limit = Number(searchParams.get('limit')) || 50
    const offset = Number(searchParams.get('offset')) || 0
    const search = searchParams.get('search') || undefined
    const postType = 'news'
    const visibility = 'public'

    const result = await getAllPosts({
      limit,
      offset,
      search,
      postType,
      visibility,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching post contents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // 요청 데이터 유효성 검사
    const validation = postContentsCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 },
      )
    }

    const { title, content, category, tags, postType, thumbnailUrl } =
      validation.data

    // Posts와 PostContents 함께 저장
    const result = await savePostWithContents({
      title,
      content,
      category,
      tags: tags && tags.length > 0 ? tags.join(',') : null,
      thumbnailUrl, // 썸네일은 별도로 처리
      userId: session.user.id,
      postType: postType,
      visibility: 'private',
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating post contents:', error)

    if (error instanceof ChatSDKError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 },
      )
    }

    const body = await request.json()

    // 요청 데이터 유효성 검사
    const validation = postContentsUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 },
      )
    }

    const { title, content, category, tags, thumbnailUrl } = validation.data

    // PostContents 업데이트
    const updatedPostContents = await updatePostContents({
      id,
      title,
      content,
      category,
      tags: tags && tags.length > 0 ? tags.join(',') : null,
      thumbnailUrl,
      summaryType: 'auto_truncated', // 기본값으로 auto_truncated 사용
    })

    if (!updatedPostContents || updatedPostContents.length === 0) {
      return NextResponse.json(
        { error: 'Post contents not found' },
        { status: 404 },
      )
    }

    return NextResponse.json(updatedPostContents[0])
  } catch (error) {
    console.error('Error updating post contents:', error)

    if (error instanceof ChatSDKError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 },
      )
    }

    // PostContents 삭제
    const deletedPostContents = await deletePostContentsById({ id })

    if (!deletedPostContents || deletedPostContents.length === 0) {
      return NextResponse.json(
        { error: 'Post contents not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post contents:', error)

    if (error instanceof ChatSDKError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
