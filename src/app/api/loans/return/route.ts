import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

  const { loanId } = await req.json()
  if (!loanId) return NextResponse.json({ error: 'loanId가 필요합니다' }, { status: 400 })

  const loan = await prisma.loan.findUnique({ where: { id: loanId } })
  if (!loan) return NextResponse.json({ error: '대출 기록을 찾을 수 없습니다' }, { status: 404 })
  if (loan.status === 'RETURNED') {
    return NextResponse.json({ error: '이미 반납된 도서입니다' }, { status: 400 })
  }

  const [updatedLoan] = await prisma.$transaction([
    prisma.loan.update({
      where: { id: loanId },
      data: { status: 'RETURNED', returnDate: new Date() },
      include: { book: true, student: true },
    }),
    prisma.book.update({
      where: { id: loan.bookId },
      data: { availableQty: { increment: 1 } },
    }),
  ])

  return NextResponse.json({ success: true, loan: updatedLoan })
}
