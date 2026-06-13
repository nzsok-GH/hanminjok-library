'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MobileNav, DesktopSidebar } from '@/components/ui/Navbar'

const LANGUAGE_OPTIONS = [
  { value: 'KOREAN', label: '한국어' },
  { value: 'ENGLISH', label: 'English' },
  { value: 'OTHER', label: '기타' },
]

const CATEGORY_OPTIONS = [
  '소설', '동화', '그림책', '역사', '과학', '수학', '사회', '예술',
  '종교', '철학', '언어', '백과사전', '만화', '기타',
]

interface Book {
  id: string
  bookCode: string
  title: string
  author: string | null
  publisher: string | null
  publishYear: number | null
  isbn: string | null
  language: string
  category: string | null
  location: string | null
  totalQuantity: number
  availableQty: number
  coverImageUrl: string | null
  description: string | null
  loans: Loan[]
}

interface Loan {
  id: string
  checkoutDate: string
  dueDate: string
  returnDate: string | null
  status: string
  student: { name: string; className: string }
  teacher: { name: string }
}

export default function BookDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchBook()
  }, [id])

  async function fetchBook() {
    try {
      const res = await fetch(`/api/books/${id}`)
      if (res.ok) setBook(await res.json())
    } catch {}
    setLoading(false)
  }

  function updateField(field: keyof Book, value: any) {
    setBook((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!book) return
    setSaving(true)
    setSaveResult(null)
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      })
      if (res.ok) {
        setSaveResult({ ok: true, msg: '저장되었습니다.' })
        setTimeout(() => setSaveResult(null), 2000)
      } else {
        const err = await res.json()
        setSaveResult({ ok: false, msg: err.error || '저장에 실패했습니다.' })
      }
    } catch {
      setSaveResult({ ok: false, msg: '네트워크 오류가 발생했습니다.' })
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('이 도서를 삭제하시겠습니까?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
      if (res.ok) router.push('/books')
      else alert('삭제에 실패했습니다.')
    } catch {
      alert('네트워크 오류가 발생했습니다.')
    }
    setDeleting(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const { url } = await res.json()
        updateField('coverImageUrl', url)
      } else {
        alert('이미지 업로드에 실패했습니다.')
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.')
    }
    setUploadingImage(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        도서를 찾을 수 없습니다.
      </div>
    )
  }

  const activeLoans = book.loans.filter((l) => l.status === 'ACTIVE' || l.status === 'EXTENDED')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DesktopSidebar />

      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 text-lg font-bold">←</button>
          <h1 className="flex-1 text-lg font-bold text-gray-900 truncate">{book.title}</h1>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
          >
            {deleting ? '삭제 중…' : '삭제'}
          </button>
        </header>

        <div className="max-w-2xl mx-auto p-4 md:p-8 pb-24 md:pb-8 space-y-4">
          {/* Cover image */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex gap-4 items-start">
              <div className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                {book.coverImageUrl ? (
                  <img src={book.coverImageUrl} alt="표지" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">📚</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2">도서 코드: {book.bookCode}</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {uploadingImage ? '업로드 중…' : '📷 표지 업로드'}
                </button>
                {book.coverImageUrl && (
                  <div className="mt-2">
                    <input
                      type="url"
                      value={book.coverImageUrl}
                      onChange={(e) => updateField('coverImageUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                {!book.coverImageUrl && (
                  <input
                    type="url"
                    value={book.coverImageUrl || ''}
                    onChange={(e) => updateField('coverImageUrl', e.target.value)}
                    placeholder="표지 이미지 URL (선택)"
                    className="mt-2 w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">기본 정보</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={book.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">저자</label>
                <input
                  type="text"
                  value={book.author || ''}
                  onChange={(e) => updateField('author', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">출판사</label>
                  <input
                    type="text"
                    value={book.publisher || ''}
                    onChange={(e) => updateField('publisher', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">출판년도</label>
                  <input
                    type="number"
                    value={book.publishYear || ''}
                    onChange={(e) => updateField('publishYear', e.target.value ? parseInt(e.target.value) : null)}
                    min="1900" max="2099"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                <input
                  type="text"
                  value={book.isbn || ''}
                  onChange={(e) => updateField('isbn', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">분류/재고</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">언어</label>
                  <select
                    value={book.language}
                    onChange={(e) => updateField('language', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LANGUAGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
                  <select
                    value={book.category || ''}
                    onChange={(e) => updateField('category', e.target.value || null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">선택</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">서가 위치</label>
                  <input
                    type="text"
                    value={book.location || ''}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="A-3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">총 수량</label>
                  <input
                    type="number"
                    value={book.totalQuantity}
                    onChange={(e) => updateField('totalQuantity', parseInt(e.target.value) || 1)}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">대출 가능</label>
                  <input
                    type="number"
                    value={book.availableQty}
                    onChange={(e) => updateField('availableQty', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {saveResult && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  saveResult.ok
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {saveResult.ok ? '✅' : '❌'} {saveResult.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중…' : '💾 저장'}
            </button>
          </form>

          {/* Current loans */}
          {activeLoans.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
                현재 대출 현황 ({activeLoans.length}건)
              </h2>
              <div className="space-y-2">
                {activeLoans.map((loan) => {
                  const overdue = new Date(loan.dueDate) < new Date()
                  return (
                    <div key={loan.id} className="flex items-center gap-3 text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{loan.student.name}</p>
                        <p className="text-xs text-gray-500">{loan.student.className}</p>
                      </div>
                      <p
                        className={`text-xs ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}
                      >
                        {new Date(loan.dueDate).toLocaleDateString('ko-KR')} {overdue ? '⚠️연체' : ''}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  )
}
