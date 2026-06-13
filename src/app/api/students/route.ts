import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const className = searchParams.get('className') || ''

  const students = await prisma.student.findMany({
    where: {
      AND: [
        search
          ? { name: { contains: search, mode: 'insensitive' } }
          : {},
        className ? { className } : {},
      ],
    },
    include: {
      loans: { where: { status: 'ACTIVE' }, select: { id: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(students)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, className, gradeLevel } = body

  if (!name || !className) {
    return NextResponse.json({ error: '이름과 반은 필수입니다' }, { status: 400 })
  }

  const student = await prisma.student.create({
    data: {
      studentCode: 'S' + Date.now(),
      name,
      className,
      gradeLevel: gradeLevel || null,
    },
  })

  return NextResponse.json(student, { status: 201 })
}
