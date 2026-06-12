'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface BookForm {
  title: string
  author: string
  publisher: string
  publishYear: string
  isbn: string
  language: string
  category: string
  location: string
  quantity: number
  coverImageUrl: string
  description: string
}

const EMPTY_FORM: BookForm = {
  title: '',
  author: '',
  publisher: '',
  publishYear: '',
  isbn: '',
  language: 'KOREAN',
  category: '',
  location: '',
  quantity: 1,
  coverImageUrl: '',
  description: '',
}

const LANGUAGE_OPTIONS = [
  { value: 'KOREAN', label: '한국어' },
  { value: 'ENGLISH', label: 'English' },
  { value: 'OTHER', label: '기타' },
]

const CATEGORY_OPTIONS = [
  '소설', '동화', '그림책', '역사', '과학', '수학', '사회', '예술',
  '종교', '철학', '언어', '백과사전', '만화', '기타',
]

export default function AddBookPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'barcode' | 'manual'>('barcode')
  const [form, setForm] = useState<BookForm>(EMPTY_FORM)
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'found' | 'error'>('idle')
  const [scanMessage, setScanMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isTitleSearching, setIsTitleSearching] = useState(false)
  const scannerRef = useRef<any>(null)
  const scannerContainerId = 'isbn-scanner'
  const hasScanned = useRef(false)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch {}
      scannerRef.current = null
    }
  }, [])

  const startScanner = useCallback(async () => {
    hasScanned.current = false
    setScanStatus('scanning')
    setScanMessage('카메라를 책의 ISBN 바코드에 맞춰주세요')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(scannerContainerId)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 120 } },
        async (decodedText: string) => {
          if (hasScanned.current) return
          hasScanned.current = true
          setScanStatus('found')
          setScanMessage(`ISBN 감지됨: ${decodedText} — 도서 정보 조회 중…`)
          await stopScanner()
          await lookupByIsbn(decodedText)
        },
        () => {}
      )
    } catch (err: any) {
      setScanStatus('error')
      setScanMessage('카메라를 시작할 수 없습니다. 카메라 권한을 확인하세요.')
    }
  }, [stopScanner])

  useEffect(() => { return () => { stopScanner() } }, [stopScanner])

  useEffect(() => {
    if (activeTab === 'barcode' && scanStatus === 'idle') startScanner()
    if (activeTab !== 'barcode') { stopScanner(); setScanStatus('idle') }
  }, [activeTab])

  async function lookupByIsbn(isbn: string) {
    try {
      const res = await fetch(`/api/books/lookup?isbn=${encodeURIComponent(isbn)}`)
      const data = await res.json()
      if (data.found && data.book) {
        setForm((prev) => ({
          ...prev,
          title: data.book.title || prev.title,
          author: data.book.author || prev.author,
          publisher: data.book.publisher || prev.publisher,
          publishYear: data.book.publishYear?.toString() || prev.publishYear,
          isbn: data.book.isbn || isbn,
          language: data.book.language || prev.language,
          category: data.book.category || prev.category,
          coverImageUrl: data.book.coverImageUrl || prev.coverImageUrl,
          description: data.book.description || prev.description,
        }))
        setScanMessage('도서 정보를 불러왔습니다. 내용을 확인하고 저장하세요.')
        setActiveTab('manual')
      } else {
        setScanMessage(`ISBN ${isbn} — 도서 정보를 찾을 수 없습니다. 직접 입력하세요.`)
        setForm((prev) => ({ ...prev, isbn }))
        setActiveTab('manual')
      }
    } catch {
      setScanMessage('도서 조회 중 오류가 발생했습니다.')
      setActiveTab('manual')
    }
  }

  async function searchByTitle() {
    if (!form.title.trim()) return
    setIsTitleSearching(true)
    try {
      const res = await fetch(`/api/books/lookup?title=${encodeURIComponent(form.title)}`)
      const data = await res.json()
      if (data.found && data.book) {
        setForm((prev) => ({
          ...prev,
          author: data.book.author || prev.author,
          publisher: data.book.publisher || prev.publisher,
          publishYear: data.book.publishYear?.toString() || prev.publishYear,
          isbn: data.book.isbn || prev.isbn,
          language: data.book.language || prev.language,
          category: data.book.category || prev.category,
          coverImageUrl: data.book.coverImageUrl || prev.coverImageUrl,
          description: data.book.description || prev.description,
        }))
      }
    } catch {}
    setIsTitleSearching(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setIsSubmitting(true)
    setSubmitResult(null)
    try {
      const payload = {
        ...form,
        publishYear: form.publishYear ? parseInt(form.publishYear) : undefined,
        quantity: Number(form.quantity),
      }
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSubmitResult({ success: true, message: '도서가 성공적으로 등록되었습니다!' })
        setTimeout(() => router.push('/books'), 1500)
      } else {
        const err = await res.json()
        setSubmitResult({ success: false, message: err.error || '저장에 실패했습니다.' })
      }
    } catch {
      setSubmitResult({ success: false, message: '네트워크 오류가 발생했습니다.' })
    }
    setIsSubmitting(false)
  }

  function updateField(field: keyof BookForm, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 text-lg font-bold">←</button>
          <h1 className="text-lg font-bold text-gray-800">도서 등록</h1>
        </div>
        <div className="max-w-lg mx-auto flex border-t">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'barcode' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('barcode')}
          >
            📷 바코드 스캔
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'manual' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('manual')}
          >
            ✏️ 직접 입력
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {activeTab === 'barcode' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-600 mb-3">책 뒷면의 ISBN 바코드를 카메라에 비춰주세요.</p>
              <div id={scannerContainerId} className="w-full rounded-lg overflow-hidden bg-black" style={{ minHeight: '200px' }} />
              {scanMessage && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${
                  scanStatus === 'error' ? 'bg-red-50 text-red-700'
                  : scanStatus === 'found' ? 'bg-green-50 text-green-700'
                  : 'bg-blue-50 text-blue-700'
                }`}>
                  {scanMessage}
                </div>
              )}
              {scanStatus !== 'scanning' && (
                <button onClick={startScanner} className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  다시 스캔
                </button>
              )}
            </div>
            <div className="text-center text-gray-400 text-sm">
              바코드가 없거나 스캔이 어렵다면{' '}
              <button className="text-blue-600 underline" onClick={() => setActiveTab('manual')}>직접 입력</button>으로 전환하세요.
            </div>
          </div>
        )}

        {activeTab === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {scanMessage && scanStatus === 'found' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                ✅ {scanMessage}
              </div>
            )}
            {form.coverImageUrl && (
              <div className="flex justify-center">
                <img src={form.coverImageUrl} alt="표지" className="h-32 object-contain rounded-lg shadow" />
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">기본 정보</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} required
                    placeholder="책 제목을 입력하세요"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={searchByTitle} disabled={isTitleSearching || !form.title.trim()}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50 whitespace-nowrap">
                    {isTitleSearching ? '검색 중…' : '제목으로 검색'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">저자</label>
                <input type="text" value={form.author} onChange={(e) => updateField('author', e.target.value)}
                  placeholder="저자명" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">출판사</label>
                  <input type="text" value={form.publisher} onChange={(e) => updateField('publisher', e.target.value)}
                    placeholder="출판사" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">출판년도</label>
                  <input type="number" value={form.publishYear} onChange={(e) => updateField('publishYear', e.target.value)}
                    placeholder="2024" min="1900" max="2099"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                <input type="text" value={form.isbn} onChange={(e) => updateField('isbn', e.target.value)}
                  placeholder="978-89-XXXX-XXX-X" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">분류 정보</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">언어</label>
                  <select value={form.language} onChange={(e) => updateField('language', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {LANGUAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">분류</label>
                  <select value={form.category} onChange={(e) => updateField('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">선택</option>
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">서가 위치</label>
                  <input type="text" value={form.location} onChange={(e) => updateField('location', e.target.value)}
                    placeholder="예: A-3, 동화책 선반" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
                  <input type="number" value={form.quantity} onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
                    min="1" max="999" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">표지 이미지 URL</label>
              <input type="url" value={form.coverImageUrl} onChange={(e) => updateField('coverImageUrl', e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Google Books에서 자동 입력되거나 직접 URL을 붙여넣으세요.</p>
            </div>

            {submitResult && (
              <div className={`p-3 rounded-lg text-sm ${
                submitResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {submitResult.success ? '✅' : '❌'} {submitResult.message}
              </div>
            )}

            <button type="submit" disabled={isSubmitting || !form.title.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isSubmitting ? '저장 중…' : '📚 도서 등록'}
            </button>

            <button type="button" onClick={() => { setForm(EMPTY_FORM); setSubmitResult(null) }}
              className="w-full py-2 text-gray-500 text-sm hover:text-gray-700">
              초기화
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
