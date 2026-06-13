import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const book = await prisma.book.findUnique({
    where: { bookCode: params.code },
  })

  if (!book) return NextResponse.json({ error: '도서를 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json(book)
}
