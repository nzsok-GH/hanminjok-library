'use client'

import { useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

type ScanMode = 'CHECKOUT' | 'RETURN'
type ScanStep = 'SELECT_MODE' | 'SCAN_STUDENT' | 'SCAN_BOOK' | 'CONFIRM' | 'DONE'

export default function QRScanPage() {
  const [mode, setMode] = useState<ScanMode>('CHECKOUT')
  const [step, setStep] = useState<ScanStep>('SELECT_MODE')
  const [scannedStudent, setScannedStudent] = useState<any>(null)
  const [scannedBook, setScannedBook] = useState<any>(null)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (step === 'SCAN_STUDENT' || step === 'SCAN_BOOK') {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      )
      scannerRef.current.render(handleScan, handleError)
    }
    return () => {
      scannerRef.current?.clear().catch(console.error)
    }
  }, [step])

  const handleScan = async (decodedText: string) => {
    scannerRef.current?.pause()

    if (step === 'SCAN_STUDENT') {
      // 학생 QR 코드 조회
      const res = await fetch(`/api/students/by-code/${decodedText}`)
      const data = await res.json()
      if (data.student) {
        setScannedStudent(data.student)
        setStep('SCAN_BOOK')
      } else {
        toast.error('학생을 찾을 수 없습니다')
        scannerRef.current?.resume()
      }
    } else if (step === 'SCAN_BOOK') {
      // 도서 QR 코드 조회
      const res = await fetch(`/api/books/by-code/${decodedText}`)
      const data = await res.json()
      if (data.book) {
        setScannedBook(data.book)
        setStep('CONFIRM')
      } else {
        toast.error('도서를 찾을 수 없습니다')
        scannerRef.current?.resume()
      }
    }
  }

  const handleError = (err: string) => {
    // 스캔 오류 무시 (카메라 권한 오류만 처리)
    if (err.includes('permission')) toast.error('카메라 권한이 필요합니다')
  }

  const handleConfirm = async () => {
    const endpoint = mode === 'CHECKOUT' ? '/api/loans/checkout' : '/api/loans/return'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: scannedStudent.id,
        bookId: scannedBook.id,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(mode === 'CHECKOUT' ? '대출 완료!' : '반납 완료!')
      setStep('DONE')
    } else {
      toast.error(data.error || '처리 중 오류가 발생했습니다')
    }
  }

  const reset = () => {
    setStep('SELECT_MODE')
    setScannedStudent(null)
    setScannedBook(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-center text-blue-900 mb-6">
        📱 QR 스캔 대출/반납
      </h1>

      {step === 'SELECT_MODE' && (
        <div className="flex flex-col gap-4 max-w-sm mx-auto">
          <button
            onClick={() => { setMode('CHECKOUT'); setStep('SCAN_STUDENT') }}
            className="bg-blue-600 text-white py-6 rounded-xl text-xl font-bold shadow-lg"
          >
            📤 대출
          </button>
          <button
            onClick={() => { setMode('RETURN'); setStep('SCAN_STUDENT') }}
            className="bg-green-600 text-white py-6 rounded-xl text-xl font-bold shadow-lg"
          >
            📥 반납
          </button>
        </div>
      )}

      {(step === 'SCAN_STUDENT' || step === 'SCAN_BOOK') && (
        <div className="max-w-sm mx-auto">
          <p className="text-center text-lg font-semibold mb-4 text-gray-700">
            {step === 'SCAN_STUDENT' ? '① 학생 QR 카드를 스캔하세요' : `② 도서 QR 코드를 스캔하세요`}
          </p>
          {scannedStudent && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-center">
              ✅ 학생: <strong>{scannedStudent.name}</strong> ({scannedStudent.className})
            </div>
          )}
          <div id="qr-reader" className="rounded-xl overflow-hidden" />
        </div>
      )}

      {step === 'CONFIRM' && scannedStudent && scannedBook && (
        <div className="max-w-sm mx-auto bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-xl font-bold text-center">
            {mode === 'CHECKOUT' ? '대출 확인' : '반납 확인'}
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p>👤 학생: <strong>{scannedStudent.name}</strong></p>
            <p>📚 도서: <strong>{scannedBook.title}</strong></p>
            {mode === 'CHECKOUT' && (
              <p>📅 반납 예정: <strong>
                {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')}
              </strong></p>
            )}
          </div>
          <button
            onClick={handleConfirm}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg"
          >
            {mode === 'CHECKOUT' ? '대출 처리' : '반납 처리'}
          </button>
          <button onClick={reset} className="w-full text-gray-500 py-2">
            취소
          </button>
        </div>
      )}

      {step === 'DONE' && (
        <div className="max-w-sm mx-auto text-center space-y-4">
          <div className="text-6xl">✅</div>
          <p className="text-xl font-bold text-green-700">
            {mode === 'CHECKOUT' ? '대출 완료!' : '반납 완료!'}
          </p>
          <button
            onClick={reset}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold"
          >
            다시 스캔
          </button>
        </div>
      )}
    </div>
  )
}
