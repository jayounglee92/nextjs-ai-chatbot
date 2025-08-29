import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/(auth)/auth.config'

export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 요청 본문 파싱
    const { title, content } = await request.json()

    // 유효성 검사
    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수입니다.' },
        { status: 400 },
      )
    }

    // 여기에 실제 데이터베이스 저장 로직을 구현합니다
    // 예시: 데이터베이스에 저장
    const aiUseCase = {
      id: Date.now().toString(), // 임시 ID 생성
      title: title.trim(),
      content: content.trim(),
      authorId: session.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 성공 응답
    return NextResponse.json(
      {
        message: '성공적으로 저장되었습니다.',
        data: aiUseCase,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('AI use case 저장 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 여기에 실제 데이터베이스 조회 로직을 구현합니다
    // 예시: 데이터베이스에서 조회
    const aiUseCases = []

    return NextResponse.json({ data: aiUseCases })
  } catch (error) {
    console.error('AI use case 조회 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
