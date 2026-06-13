import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const student = await prisma.student.findUnique({
    where: { studentCode: params.code },
  })

  if (!student) return NextResponse.json({ error: '학생을 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json(student)
}
