import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/ui/DashboardClient'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')

  // 오늘 현황 데이터
  const [totalBooks, activeLoans, overdueLoans, totalStudents] = await Promise.all([
    prisma.book.count(),
    prisma.loan.count({ where: { status: 'ACTIVE' } }),
    prisma.loan.count({
      where: { status: 'ACTIVE', dueDate: { lt: new Date() } }
    }),
    prisma.student.count(),
  ])

  // 최근 대출 5건
  const recentLoans = await prisma.loan.findMany({
    take: 5,
    orderBy: { checkoutDate: 'desc' },
    include: { book: true, student: true },
  })

  return (
    <DashboardClient
      stats={{ totalBooks, activeLoans, overdueLoans, totalStudents }}
      recentLoans={recentLoans}
      session={session}
    />
  )
}
