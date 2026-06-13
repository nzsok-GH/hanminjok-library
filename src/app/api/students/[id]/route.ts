import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      loans: {
        include: { book: true, teacher: true },
        orderBy: { checkoutDate: 'desc' },
      },
    },
  })

  if (!student) return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json(student)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { name, className, gradeLevel } = body

  const student = await prisma.student.update({
    where: { id: params.id },
    data: {
      name,
      className,
      gradeLevel: gradeLevel ?? null,
    },
  })

  return NextResponse.json(student)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.student.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
