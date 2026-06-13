'use client'

import { MobileNav, DesktopSidebar } from '@/components/ui/Navbar'

interface TopBook {
  title: string
  count: number
  coverImageUrl?: string | null
}

interface TopStudent {
  name: string
  className: string
  count: number
}

interface ClassStat {
  className: string
  count: number
}

interface Props {
  thisMonthCheckouts: number
  thisMonthReturns: number
  overdueCount: number
  topBooks: TopBook[]
  topStudents: TopStudent[]
  classStats: ClassStat[]
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string
  label: string
  value: number
  color: string
}) {
  return (
    <div className={`rounded-xl p-4 ${color} flex flex-col gap-1`}>
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  )
}

export default function ReportsClient({
  thisMonthCheckouts,
  thisMonthReturns,
  overdueCount,
  topBooks,
  topStudents,
  classStats,
}: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DesktopSidebar />

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 md:py-5">
          <h1 className="text-lg md:text-xl font-bold text-gray-900">📊 통계 리포트</h1>
          <p className="text-sm text-gray-500 mt-0.5">이번 달 현황</p>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8 space-y-6">
          {/* Monthly stats */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">이번 달</h2>
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon="📤" label="대출" value={thisMonthCheckouts} color="bg-blue-50 text-blue-900" />
              <StatCard icon="📥" label="반납" value={thisMonthReturns} color="bg-emerald-50 text-emerald-900" />
              <StatCard
                icon="⚠️"
                label="연체"
                value={overdueCount}
                color={overdueCount > 0 ? 'bg-red-50 text-red-900' : 'bg-gray-100 text-gray-700'}
              />
            </div>
          </section>

          {/* Top books */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              많이 빌린 책 TOP 5
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              {topBooks.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">데이터가 없습니다</p>
              ) : (
                topBooks.map((book, i) => (
                  <div
                    key={book.title}
                    className={`flex items-center gap-3 px-4 py-3 ${i < topBooks.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <span className="text-lg font-bold text-gray-400 w-6 text-center">
                      {i + 1}
                    </span>
                    <div className="w-8 h-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center shrink-0">
                      {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">📚</span>
                      )}
                    </div>
                    <p className="flex-1 text-sm font-medium text-gray-900 truncate">{book.title}</p>
                    <span className="text-sm font-semibold text-blue-600 shrink-0">{book.count}회</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Top students */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              많이 빌린 학생 TOP 5
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              {topStudents.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">데이터가 없습니다</p>
              ) : (
                topStudents.map((student, i) => (
                  <div
                    key={`${student.name}-${i}`}
                    className={`flex items-center gap-3 px-4 py-3 ${i < topStudents.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <span className="text-lg font-bold text-gray-400 w-6 text-center">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <span className="text-sm">👤</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.className}</p>
                    </div>
                    <span className="text-sm font-semibold text-purple-600 shrink-0">{student.count}회</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Class stats */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              반별 대출 현황
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              {classStats.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">데이터가 없습니다</p>
              ) : (
                classStats.map((stat, i) => {
                  const maxCount = Math.max(...classStats.map((s) => s.count), 1)
                  const pct = Math.round((stat.count / maxCount) * 100)
                  return (
                    <div
                      key={stat.className}
                      className={`px-4 py-3 ${i < classStats.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-gray-900">{stat.className}</p>
                        <span className="text-sm font-semibold text-gray-600">{stat.count}회</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
