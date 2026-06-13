import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다' }, { status: 500 })
  }

  const formData = await req.formData()
  const imageFile = formData.get('image') as File | null
  if (!imageFile) {
    return NextResponse.json({ error: '이미지 파일이 필요합니다' }, { status: 400 })
  }

  const bytes = await imageFile.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = (imageFile.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: 'This is an image of books. Extract all visible book titles and publishers. Return ONLY a JSON array: [{"title": "...", "publisher": "..."}]. If publisher is not visible, use empty string.',
          },
        ],
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return NextResponse.json({ error: '책 정보를 추출할 수 없습니다' }, { status: 500 })
  }

  const raw = textBlock.text.trim()
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) {
    return NextResponse.json({ error: '책 목록을 파싱할 수 없습니다', raw }, { status: 500 })
  }

  const books: { title: string; publisher: string }[] = JSON.parse(match[0])
  return NextResponse.json({ books })
}
