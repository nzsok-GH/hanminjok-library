'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MobileNav, DesktopSidebar } from '@/components/ui/Navbar'

const LANGUAGE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'KOREAN', label: '한국어' },
  { value: 'ENGLISH', label: 'English' },
  { value: 'OTHER', label: '기타' },
]

const CATEGORY_OPTIONS = [
  '', '소설', '동화', '그림책', '역사', '과학', '수학', '사회', '예술',
  '종교', '철학', '언어', '백과사전', '만화', '기타',
]

interface Book {
  id: string
  title: string
  author: string | null
  language: string
  category: string | null
  coverImageUrl: string | null
  availableQty: number
  totalQuantity: number
  bookCode: string
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => fetchBooks(), 300)
    return () => clearTimeout(timer)
  }, [search, language, category])

  async function fetchBooks() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (language) params.set('language', language)
      if (category) params.set('category', category)
      const res = await fetch(`/api/books?${params}`)
      const data = await res.json()
      setBooks(data)
    } catch {}
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DesktopSidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-4 md:px-8 py-3 md:py-4">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-3">📚 도서 목록</h1>

            {/* Search */}
            <input
              type="search"
              placeholder="제목 또는 저자 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체 분류</option>
                {CATEGORY_OPTIONS.filter(Boolean).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Book grid */}
        <div className="p-4 md:p-8 pb-24 md:pb-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p>도서가 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {books.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow active:scale-95"
                >
                  <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center overflow-hidden">
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">📚</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-semibold text-xs text-gray-900 line-clamp-2 leading-tight mb-1">
                      {book.title}
                    </p>
                    {book.author && (
                      <p className="text-xs text-gray-500 truncate">{book.author}</p>
                    )}
                    <p
                      className={`text-xs font-semibold mt-1.5 ${
                        book.availableQty === 0
                          ? 'text-red-500'
                          : book.availableQty <= 1
                          ? 'text-orange-500'
                          : 'text-emerald-600'
                      }`}
                    >
                      {book.availableQty}/{book.totalQuantity}권 가능
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FAB */}
      <Link
        href="/books/add"
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 active:scale-95 transition-all z-40"
        title="도서 추가"
      >
        +
      </Link>

      <MobileNav />
    </div>
  )
}
