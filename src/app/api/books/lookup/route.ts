// GET /api/books/lookup?isbn=xxx  OR  ?title=xxx
// Google Books API로 도서 메타데이터 조회

import { NextRequest, NextResponse } from "next/server"

interface GoogleBookItem {
  id: string
  volumeInfo: {
    title?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    industryIdentifiers?: Array<{ type: string; identifier: string }>
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    language?: string
    categories?: string[]
    pageCount?: number
  }
}

function extractBookData(item: GoogleBookItem) {
  const v = item.volumeInfo
  const isbn13 = v.industryIdentifiers?.find((id) => id.type === "ISBN_13")?.identifier
  const isbn10 = v.industryIdentifiers?.find((id) => id.type === "ISBN_10")?.identifier

  return {
    title: v.title || "",
    author: v.authors?.join(", ") || "",
    publisher: v.publisher || "",
    publishYear: v.publishedDate ? parseInt(v.publishedDate.substring(0, 4)) : undefined,
    isbn: isbn13 || isbn10 || "",
    language: v.language === "ko" ? "KOREAN" : v.language === "en" ? "ENGLISH" : "OTHER",
    category: v.categories?.[0] || "",
    coverImageUrl: v.imageLinks?.thumbnail?.replace("http://", "https://") || "",
    description: v.description || "",
    pageCount: v.pageCount,
    googleBooksId: item.id,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const isbn = searchParams.get("isbn")?.trim()
  const title = searchParams.get("title")?.trim()

  if (!isbn && !title) {
    return NextResponse.json(
      { error: "isbn 또는 title 파라미터가 필요합니다" },
      { status: 400 }
    )
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  let query: string

  if (isbn) {
    const cleanIsbn = isbn.replace(/[- ]/g, "")
    query = `isbn:${cleanIsbn}`
  } else {
    query = `intitle:${encodeURIComponent(title!)}`
  }

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5${apiKey ? `&key=${apiKey}` : ""}`
    const res = await fetch(url)

    if (!res.ok) {
      const err = await res.text()
      console.error("Google Books API 오류:", err)
      return NextResponse.json({ error: "Google Books API 오류" }, { status: 502 })
    }

    const data = await res.json()

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ found: false, results: [] })
    }

    if (isbn) {
      const book = extractBookData(data.items[0] as GoogleBookItem)
      return NextResponse.json({ found: true, book, results: [book] })
    } else {
      const results = (data.items as GoogleBookItem[]).map(extractBookData)
      return NextResponse.json({ found: true, book: results[0], results })
    }
  } catch (error) {
    console.error("도서 조회 오류:", error)
    return NextResponse.json({ error: "도서 조회 중 오류가 발생했습니다" }, { status: 500 })
  }
}
