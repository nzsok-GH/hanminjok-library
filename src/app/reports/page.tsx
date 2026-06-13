import { prisma } from '@/lib/prisma'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [checkoutRows, returnRows, overdueCount, loanGroupsByBook, loanGroupsByStudent] =
    await Promise.all([
      prisma.loan.count({
        where: { checkoutDate: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.loan.count({
        where: {
          status: 'RETURNED',
          returnDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.loan.count({ where: { status: 'ACTIVE', dueDate: { lt: now } } }),
      prisma.loan.groupBy({
        by: ['bookId'],
        _count: { bookId: true },
        orderBy: { _count: { bookId: 'desc' } },
        take: 5,
      }),
      prisma.loan.groupBy({
        by: ['studentId'],
        _count: { studentId: true },
        orderBy: { _count: { studentId: 'desc' } },
        take: 5,
      }),
    ])

  // Fetch book details for top books
  const topBookIds = loanGroupsByBook.map((r) => r.bookId)
  const topBooksData = await prisma.book.findMany({
    where: { id: { in: topBookIds } },
    select: { id: true, title: true, coverImageUrl: true },
  })
  const topBooksMap = Object.fromEntries(topBooksData.map((b) => [b.id, b]))
  const topBooks = loanGroupsByBook.map((r) => ({
    title: topBooksMap[r.bookId]?.title ?? '(알 수 없음)',
    coverImageUrl: topBooksMap[r.bookId]?.coverImageUrl ?? null,
    count: r._count.bookId,
  }))

  // Fetch student details for top students
  const topStudentIds = loanGroupsByStudent.map((r) => r.studentId)
  const topStudentsData = await prisma.student.findMany({
    where: { id: { in: topStudentIds } },
    select: { id: true, name: true, className: true },
  })
  const topStudentsMap = Object.fromEntries(topStudentsData.map((s) => [s.id, s]))
  const topStudents = loanGroupsByStudent.map((r) => ({
    name: topStudentsMap[r.studentId]?.name ?? '(알 수 없음)',
    className: topStudentsMap[r.studentId]?.className ?? '',
    count: r._count.studentId,
  }))

  // Class stats: all-time loan count per class
  const classLoans = await prisma.loan.findMany({
    select: { student: { select: { className: true } } },
  })
  const classCountMap: Record<string, number> = {}
  for (const loan of classLoans) {
    const cls = loan.student.className
    classCountMap[cls] = (classCountMap[cls] || 0) + 1
  }
  const classStats = Object.entries(classCountMap)
    .map(([className, count]) => ({ className, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <ReportsClient
      thisMonthCheckouts={checkoutRows}
      thisMonthReturns={returnRows}
      overdueCount={overdueCount}
      topBooks={topBooks}
      topStudents={topStudents}
      classStats={classStats}
    />
  )
}
