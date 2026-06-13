'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileNav, DesktopSidebar } from '@/components/ui/Navbar'

export default function AddStudentPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [className, setClassName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !className.trim()) return
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), className: className.trim(), gradeLevel: gradeLevel.trim() || null }),
      })
      if (res.ok) {
        router.push('/students')
      } else {
        const data = await res.json()
        setError(data.error || '저장에 실패했습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DesktopSidebar />

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 md:py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-800 text-lg font-bold"
          >
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">학생 등록</h1>
        </header>

        <div className="max-w-lg mx-auto p-4 md:p-8 pb-24 md:pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="학생 이름"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                  placeholder="예: 초급 A, 중급 B"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="예: 3학년, Grade 3"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !className.trim()}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold text-base hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '저장 중…' : '👤 학생 등록'}
            </button>
          </form>
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
