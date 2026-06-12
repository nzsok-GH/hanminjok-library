'use client'

import Link from 'next/link'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import { MobileNav, DesktopSidebar } from './Navbar'

interface Stats {
  totalBooks: number
  activeLoans: number
  overdueLoans: number
  totalStudents: number
}

interface RecentLoan {
  id: string
  checkoutDate: Date
  dueDate: Date
  status: string
  book: { title: string }
  student: { name: string }
}

interface Props {
  stats: Stats
  recentLoans: RecentLoan[]
  session: Session
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: number
  color: string
  icon: string
}) {
  return (
    <div className={`rounded-xl p-4 ${color} flex flex-col gap-1`}>
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  )
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({
  href,
  icon,
  label,
  color,
}: {
  href: string
  icon: string
  label: string
  color: string
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl ${color} text-white font-semibold text-sm transition-opacity hover:opacity-90 active:scale-95`}
    >
      <span className="text-3xl">{icon}</span>
      {label}
    </Link>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardClient({ stats, recentLoans, session }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <DesktopSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* ── Mobile header ── */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500">한민족 한글학교</p>
            <h1 className="font-bold text-gray-900">📖 도서관 현황</h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            로그아웃
          </button>
        </header>

        {/* ── Desktop header ── */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
            <p className="text-sm text-gray-500">
              {session.user?.name ?? session.user?.email} 선생님, 환영합니다!
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
          >
            🚪 로그아웃
          </button>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8 space-y-6">
          {/* ── Today's stats ── */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              오늘 현황
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="전체 도서"
                value={stats.totalBooks}
                color="bg-blue-50 text-blue-900"
                icon="📚"
              />
              <StatCard
                label="대출 중"
                value={stats.activeLoans}
                color="bg-emerald-50 text-emerald-900"
                icon="📤"
              />
              <StatCard
                label="연체"
                value={stats.overdueLoans}
                color={
                  stats.overdueLoans > 0
                    ? 'bg-red-50 text-red-900'
                    : 'bg-gray-100 text-gray-700'
                }
                icon="⚠️"
              />
              <StatCard
                label="학생 수"
                value={stats.totalStudents}
                color="bg-purple-50 text-purple-900"
                icon="👨‍👧‍👦"
              />
            </div>
          </section>

          {/* ── Mobile quick actions ── */}
          <section className="md:hidden">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              빠른 실행
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <QuickAction
                href="/qr-scan?mode=checkout"
                icon="📤"
                label="대출"
                color="bg-blue-600"
              />
              <QuickAction
                href="/qr-scan?mode=return"
                icon="📥"
                label="반납"
                color="bg-emerald-600"
              />
              <QuickAction
                href="/books/add"
                icon="➕"
                label="도서 추가"
                color="bg-violet-600"
              />
            </div>
          </section>

          {/* ── Recent loans ── */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              최근 대출
            </h2>
            {recentLoans.length === 0 ? (
              <p className="text-gray-400 text-sm">대출 기록이 없습니다.</p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {recentLoans.map((loan, i) => (
                  <div
                    key={loan.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      i < recentLoans.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <span className="text-lg">📖</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {loan.book.title}
                      </p>
                      <p className="text-xs text-gray-500">{loan.student.name}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        loan.status === 'ACTIVE'
                          ? new Date(loan.dueDate) < new Date()
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {loan.status === 'ACTIVE'
                        ? new Date(loan.dueDate) < new Date()
                          ? '연체'
                          : '대출 중'
                        : '반납'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Desktop quick actions ── */}
          <section className="hidden md:block">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              빠른 실행
            </h2>
            <div className="flex gap-3">
              <QuickAction
                href="/qr-scan?mode=checkout"
                icon="📤"
                label="대출"
                color="bg-blue-600"
              />
              <QuickAction
                href="/qr-scan?mode=return"
                icon="📥"
                label="반납"
                color="bg-emerald-600"
              />
              <QuickAction
                href="/books/add"
                icon="➕"
                label="도서 추가"
                color="bg-violet-600"
              />
            </div>
          </section>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
