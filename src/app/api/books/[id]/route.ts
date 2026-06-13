import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const book = await prisma.book.findUnique({
    where: { id: params.id },
    include: {
      loans: {
        include: { student: true, teacher: true },
        orderBy: { checkoutDate: 'desc' },
      },
    },
  })

  if (!book) return NextResponse.json({ error: '도서를 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json(book)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const {
    title,
    author,
    publisher,
    publishYear,
    isbn,
    language,
    category,
    location,
    totalQuantity,
    availableQty,
    coverImageUrl,
    description,
  } = body

  const book = await prisma.book.update({
    where: { id: params.id },
    data: {
      title,
      author: author ?? null,
      publisher: publisher ?? null,
      publishYear: publishYear ? Number(publishYear) : null,
      isbn: isbn ?? null,
      language: language || 'KOREAN',
      category: category ?? null,
      location: location ?? null,
      totalQuantity: totalQuantity !== undefined ? Number(totalQuantity) : undefined,
      availableQty: availableQty !== undefined ? Number(availableQty) : undefined,
      coverImageUrl: coverImageUrl ?? null,
      description: description ?? null,
    },
  })

  return NextResponse.json(book)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.book.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
