// POST /api/books/scan-set
// 세트 사진 → Google Cloud Vision OCR → 책 목록 인식 → Google Books API → DB 저장

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'

// Words/patterns to skip when filtering OCR text lines
const SKIP_PATTERNS = [
  /^\d+$/, // numbers only
  /^[a-zA-Z]{1,3}$/, // very short English (like "ISBN", "pp")
  /^[가-힣]{1,2}$/, // 1-2 char Korean
  /^(도서관|library|isbn|page|pp|vol|no|ed|edition|저자|출판|발행)$/i,
]

function isLikelyTitle(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 4) return false
  if (SKIP_PATTERNS.some((p) => p.test(trimmed))) return false
  // Must contain at least some Korean or substantial English
  const hasKorean = /[가-힣]/.test(trimmed)
  const hasSubstantialEnglish = /[a-zA-Z]{3,}/.test(trimmed)
  return hasKorean || hasSubstantialEnglish
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File
    const setName = formData.get('setName') as string

    if (!imageFile) {
      return NextResponse.json({ error: '이미지가 필요합니다' }, { status: 400 })
    }

    // 1. Cloudinary에 이미지 업로드
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
    const cloudinaryUrl = await uploadToCloudinary(imageBuffer, 'book-sets')

    // 2. Google Cloud Vision API로 텍스트 감지 (OCR)
    const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY
    if (!visionApiKey) {
      return NextResponse.json({ error: 'Google Cloud Vision API 키가 설정되지 않았습니다' }, { status: 500 })
    }

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { source: { imageUri: cloudinaryUrl } },
              features: [{ type: 'TEXT_DETECTION', maxResults: 50 }],
            },
          ],
        }),
      }
    )

    if (!visionResponse.ok) {
      const errText = await visionResponse.text()
      console.error('Vision API 오류:', errText)
      return NextResponse.json({ error: 'Vision API 호출 실패' }, { status: 502 })
    }

    const visionData = await visionResponse.json()
    const fullText: string = visionData.responses?.[0]?.fullTextAnnotation?.text || ''

    // 3. OCR 텍스트에서 책 제목 후보 추출
    const rawLines = fullText.split('\n').map((l: string) => l.trim()).filter(Boolean)
    const candidateLines = rawLines.filter(isLikelyTitle)

    // Deduplicate similar lines
    const uniqueCandidates = candidateLines.filter((line, idx, arr) =>
      arr.findIndex((l) => l === line) === idx
    )

    // 4. Google Books API로 각 후보 조회
    const recognizedBooks: Array<{
      title: string
      author: string
      publisher?: string
      publishYear?: number
      isbn?: string
      coverImageUrl?: string
      description?: string
    }> = []

    for (const candidate of uniqueCandidates.slice(0, 20)) {
      try {
        const query = encodeURIComponent(candidate)
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}&maxResults=1&langRestrict=ko&key=${process.env.GOOGLE_BOOKS_API_KEY}`
        )
        const data = await res.json()
        const item = data.items?.[0]?.volumeInfo
        if (!item) continue

        // Only include if title similarity is reasonable
        const apiTitle: string = item.title || ''
        if (!apiTitle) continue

        recognizedBooks.push({
          title: apiTitle,
          author: item.authors?.join(', ') || '',
          publisher: item.publisher,
          publishYear: item.publishedDate ? parseInt(item.publishedDate.substring(0, 4)) : undefined,
          isbn: item.industryIdentifiers?.find((id: { type: string; identifier: string }) => id.type === 'ISBN_13')?.identifier,
          coverImageUrl: item.imageLinks?.thumbnail?.replace('http://', 'https://'),
          description: item.description,
        })
      } catch {
        // Skip failed lookups silently
      }
    }

    // Deduplicate by ISBN or title
    const seen = new Set<string>()
    const deduped = recognizedBooks.filter((book) => {
      const key = book.isbn || book.title
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // 5. 도서 세트 생성
    const bookSet = await prisma.bookSet.create({
      data: {
        name: setName || `세트 ${new Date().toLocaleDateString('ko-KR')}`,
        imageUrl: cloudinaryUrl,
      },
    })

    // 6. 각 책 DB 저장 (중복 ISBN 제외)
    const savedBooks = []
    for (const bookData of deduped) {
      try {
        if (bookData.isbn) {
          const existing = await prisma.book.findUnique({ where: { isbn: bookData.isbn } })
          if (existing) {
            savedBooks.push({ ...existing, skipped: true })
            continue
          }
        }

        const bookCode = `B${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`
        const book = await prisma.book.create({
          data: {
            ...bookData,
            bookCode,
            setId: bookSet.id,
            language: 'KOREAN',
          },
        })
        savedBooks.push(book)
      } catch (err) {
        console.error(`책 저장 실패: ${bookData.title}`, err)
      }
    }

    return NextResponse.json({
      success: true,
      setId: bookSet.id,
      ocrLines: rawLines.length,
      candidates: uniqueCandidates.length,
      recognized: deduped.length,
      saved: savedBooks.filter((b: any) => !b.skipped).length,
      skipped: savedBooks.filter((b: any) => b.skipped).length,
      books: savedBooks,
      imageUrl: cloudinaryUrl,
    })
  } catch (error) {
    console.error('세트 스캔 오류:', error)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다' }, { status: 500 })
  }
}
