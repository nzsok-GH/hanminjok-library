import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const studentId = searchParams.get('studentId') || ''
  const bookId = searchParams.get('bookId') || ''

  const loans = await prisma.loan.findMany({
    where: {
      AND: [
        status ? { status: status as any } : {},
        studentId ? { studentId } : {},
        bookId ? { bookId } : {},
      ],
    },
    include: {
      book: true,
      student: true,
      teacher: true,
    },
    orderBy: { checkoutDate: 'desc' },
  })

  return NextResponse.json(loans)
}
