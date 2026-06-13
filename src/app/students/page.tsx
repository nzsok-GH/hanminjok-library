'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MobileNav, DesktopSidebar } from '@/components/ui/Navbar'

interface Student {
  id: string
  name: string
  className: string
  gradeLevel: string | null
  studentCode: string
  loans: { id: string }[]
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [className, setClassName] = useState('')
  const [classes, setClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(), 300)
    return () => clearTimeout(timer)
  }, [search, className])

  async function fetchStudents() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (className) params.set('className', className)
      const res = await fetch(`/api/students?${params}`)
      const data: Student[] = await res.json()
      setStudents(data)
      if (!search && !className) {
        const unique = [...new Set(data.map((s) => s.className))].sort()
        setClasses(unique)
      }
    } catch {}
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DesktopSidebar />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-4 md:px-8 py-3 md:py-4">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-3">👨‍👧‍👦 학생 목록</h1>
            <input
              type="search"
              placeholder="학생 이름 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 반</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">👤</p>
              <p>학생이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <Link
                  key={student.id}
                  href={`/students/${student.id}`}
                  className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <span className="text-lg">👤</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{student.name}</p>
                    <p className="text-xs text-gray-500">
                      {student.className}
                      {student.gradeLevel && ` · ${student.gradeLevel}`}
                    </p>
                  </div>
                  {student.loans.length > 0 && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                      대출 {student.loans.length}권
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FAB */}
      <Link
        href="/students/add"
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-purple-700 active:scale-95 transition-all z-40"
        title="학생 추가"
      >
        +
      </Link>

      <MobileNav />
    </div>
  )
}
