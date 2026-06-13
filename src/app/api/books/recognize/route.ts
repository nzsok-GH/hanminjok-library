import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다' }, { status: 500 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: '이미지 파일이 없습니다' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' | 'image/heif'

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
      'This is an image of books. Extract all visible book titles and publishers. Return ONLY a valid JSON array with no markdown, no code blocks, just raw JSON: [{"title": "...", "publisher": "..."}]. If publisher is not visible, use empty string. If no books found, return [].',
    ])

    const text = result.response.text().trim()
    const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
    const books = JSON.parse(clean)
    return NextResponse.json({ books })
  } catch (error: any) {
    console.error('Gemini recognize error:', error)
    return NextResponse.json({ error: error.message || '인식 실패' }, { status: 500 })
  }
}
