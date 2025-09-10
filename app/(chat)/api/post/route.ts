import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import {
  getAllPosts,
  getPostById,
  savePostWithContents,
  updatePostContents,
  deletePostContentsById,
} from '@/lib/db/queries'
import {
  postContentsUpdateSchema,
  validatePostContentsCreate,
} from '@/lib/validators/post-contents'

// GET: 포스트 목록 조회 또는 단일 포스트 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const postType = searchParams.get('postType') || 'news' // 기본값은 news
    const itemsPerPage = searchParams.get('itemsPerPage')
    const page = searchParams.get('page')
    const search = searchParams.get('search')

    // 단일 포스트 조회
    if (id) {
      const postData = await getPostById({ id })
      return NextResponse.json(postData)
    }

    // 페이지네이션 파라미터 처리
    const limit = itemsPerPage ? Number.parseInt(itemsPerPage) : 6
    const currentPage = page ? Number.parseInt(page) : 1
    const offset = (currentPage - 1) * limit

    // 포스트 목록 조회 (페이지네이션 및 검색 적용)
    const result = await getAllPosts({
      postType,
      limit,
      offset,
      search: search || undefined,
    })

    // 페이지네이션 메타데이터 계산
    const totalPages = Math.ceil(result.totalCount / limit)
    const hasNextPage = currentPage < totalPages
    const hasPrevPage = currentPage > 1

    return NextResponse.json({
      data: result.data,
      pagination: {
        currentPage,
        totalPages,
        totalCount: result.totalCount,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    })
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 },
    )
  }
}

// POST: 새 포스트 생성
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validatePostContentsCreate(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 },
      )
    }

    const {
      title,
      content,
      category,
      tags,
      thumbnailUrl,
      postType = 'news',
      openType,
    } = validation.data

    console.log({
      title,
      content,
      category,
      tags: tags && tags.length > 0 ? tags.join(',') : null,
      thumbnailUrl,
      userId: session.user.id,
      postType: postType as 'news' | 'aiusecase' | 'learningcenter',
      openType: openType || 'page',
      summaryType: 'auto_truncated',
    })

    const newPost = await savePostWithContents({
      title,
      content,
      category,
      tags: tags && tags.length > 0 ? tags.join(',') : null,
      thumbnailUrl,
      userId: session.user.id,
      postType: postType as 'news' | 'aiusecase' | 'learningcenter',
      openType: openType || 'page',
      summaryType: 'auto_truncated',
    })

    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    console.error('Failed to create post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 },
    )
  }
}

// PUT: 포스트 수정
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
    const validation = postContentsUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 },
      )
    }

    const { title, content, category, tags, thumbnailUrl } = validation.data

    const updatedPostContents = await updatePostContents({
      id,
      title,
      content,
      category,
      tags: tags && tags.length > 0 ? tags.join(',') : null,
      thumbnailUrl,
      summaryType: 'auto_truncated',
    })

    return NextResponse.json(updatedPostContents)
  } catch (error) {
    console.error('Failed to update post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 },
    )
  }
}

// DELETE: 포스트 삭제
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

    const deletedPostContents = await deletePostContentsById({ id })

    return NextResponse.json({ success: true, data: deletedPostContents })
  } catch (error) {
    console.error('Failed to delete post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 },
    )
  }
}
