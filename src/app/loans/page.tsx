'use client'

import { useState, useEffect } from 'react'
import { MobileNav, DesktopSidebar } from '@/components/ui/Navbar'

type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'EXTENDED'

interface Loan {
  id: string
  checkoutDate: string
  dueDate: string
  returnDate: string | null
  status: LoanStatus
  notes: string | null
  book: { id: string; title: string; coverImageUrl: string | null }
  student: { id: string; name: string; className: string }
  teacher: { name: string }
}

const TABS: { label: string; value: string }[] = [
  { label: '전체', value: '' },
  { label: '대출중', value: 'ACTIVE' },
  { label: '반납완료', value: 'RETURNED' },
  { label: '연체', value: 'OVERDUE' },
]

const STATUS_LABEL: Record<LoanStatus, string> = {
  ACTIVE: '대출중',
  RETURNED: '반납완료',
  OVERDUE: '연체',
  EXTENDED: '연장',
}

function isOverdue(loan: Loan) {
  return loan.status === 'ACTIVE' && new Date(loan.dueDate) < new Date()
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [tab, setTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [returningId, setReturningId] = useState<string | null>(null)

  useEffect(() => {
    fetchLoans()
  }, [tab])

  async function fetchLoans() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tab) params.set('status', tab)
      const res = await fetch(`/api/loans?${params}`)
      setLoans(await res.json())
    } catch {}
    setLoading(false)
  }

  async function handleReturn(loanId: string) {
    if (!confirm('반납 처리하시겠습니까?')) return
    setReturningId(loanId)
    try {
      const res = await fetch('/api/loans/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId }),
      })
      if (res.ok) {
        fetchLoans()
      } else {
        const data = await res.json()
        alert(data.error || '반납 처리에 실패했습니다.')
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.')
    }
    setReturningId(null)
  }

  const displayLoans = tab === ''
    ? loans
    : tab === 'ACTIVE'
    ? loans.filter((l) => l.status === 'ACTIVE' || l.status === 'EXTENDED')
    : loans.filter((l) => l.status === tab)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DesktopSidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-4 md:px-8 py-3 md:py-4">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-3">📋 대출 내역</h1>
            {/* Tabs */}
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    tab === t.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayLoans.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p>대출 기록이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayLoans.map((loan) => {
                const overdue = isOverdue(loan)
                return (
                  <div
                    key={loan.id}
                    className={`bg-white rounded-xl border shadow-sm p-4 ${
                      overdue ? 'border-red-200' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {loan.book.coverImageUrl ? (
                          <img
                            src={loan.book.coverImageUrl}
                            alt={loan.book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">📚</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {loan.book.title}
                          </p>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                              overdue
                                ? 'bg-red-100 text-red-700'
                                : loan.status === 'RETURNED'
                                ? 'bg-gray-100 text-gray-500'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {overdue ? '연체' : STATUS_LABEL[loan.status]}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 mt-0.5">
                          {loan.student.name}{' '}
                          <span className="text-gray-400">({loan.student.className})</span>
                        </p>

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span>
                            대출: {new Date(loan.checkoutDate).toLocaleDateString('ko-KR')}
                          </span>
                          <span
                            className={
                              overdue ? 'text-red-600 font-semibold' : ''
                            }
                          >
                            반납예정: {new Date(loan.dueDate).toLocaleDateString('ko-KR')}
                          </span>
                        </div>

                        {loan.returnDate && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            반납: {new Date(loan.returnDate).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>
                    </div>

                    {(loan.status === 'ACTIVE' || loan.status === 'EXTENDED') && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleReturn(loan.id)}
                          disabled={returningId === loan.id}
                          className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {returningId === loan.id ? '처리 중…' : '📥 반납'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
