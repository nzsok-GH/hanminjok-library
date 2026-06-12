// POST /api/loans/checkout — QR 스캔 대출 처리

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { studentId, bookId } = await req.json()

  // 재고 확인
  const book = await prisma.book.findUnique({ where: { id: bookId } })
  if (!book) return NextResponse.json({ error: '도서를 찾을 수 없습니다' }, { status: 404 })
  if (book.availableQty <= 0) {
    return NextResponse.json({ error: '대출 가능한 재고가 없습니다' }, { status: 400 })
  }

  // 같은 책 이미 대출 중 여부 확인
  const existingLoan = await prisma.loan.findFirst({
    where: { studentId, bookId, status: 'ACTIVE' },
  })
  if (existingLoan) {
    return NextResponse.json({ error: '이미 대출 중인 도서입니다' }, { status: 400 })
  }

  // 선생님 ID 조회
  const teacher = await prisma.teacher.findUnique({
    where: { githubId: session.user?.id || '' },
  })

  // 대출 생성 + 재고 감소 (트랜잭션)
  const [loan] = await prisma.$transaction([
    prisma.loan.create({
      data: {
        bookId,
        studentId,
        teacherId: teacher?.id || '',
        dueDate: addDays(new Date(), 14), // 기본 2주
        status: 'ACTIVE',
      },
      include: { book: true, student: true },
    }),
    prisma.book.update({
      where: { id: bookId },
      data: { availableQty: { decrement: 1 } },
    }),
  ])

  return NextResponse.json({ success: true, loan })
}
