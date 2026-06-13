import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const language = searchParams.get('language') || ''
  const category = searchParams.get('category') || ''

  const books = await prisma.book.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        language ? { language: language as any } : {},
        category ? { category } : {},
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(books)
}

export async function POST(req: NextRequest) {
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
    quantity,
    coverImageUrl,
    description,
  } = body

  if (!title) {
    return NextResponse.json({ error: '제목은 필수입니다' }, { status: 400 })
  }

  const qty = Number(quantity) || 1
  const book = await prisma.book.create({
    data: {
      bookCode: 'B' + Date.now(),
      title,
      author: author || null,
      publisher: publisher || null,
      publishYear: publishYear ? Number(publishYear) : null,
      isbn: isbn || null,
      language: language || 'KOREAN',
      category: category || null,
      location: location || null,
      totalQuantity: qty,
      availableQty: qty,
      coverImageUrl: coverImageUrl || null,
      description: description || null,
    },
  })

  return NextResponse.json(book, { status: 201 })
}
