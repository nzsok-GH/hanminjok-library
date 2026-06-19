import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, { set: boolean; valid?: boolean; error?: string }> = {}

  // 1. GEMINI_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  results.GEMINI_API_KEY = { set: !!geminiKey }
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`
      )
      results.GEMINI_API_KEY.valid = res.ok
      if (!res.ok) results.GEMINI_API_KEY.error = `HTTP ${res.status}`
    } catch (e: any) {
      results.GEMINI_API_KEY.valid = false
      results.GEMINI_API_KEY.error = e.message
    }
  }

  // 2. GOOGLE_BOOKS_API_KEY
  const booksKey = process.env.GOOGLE_BOOKS_API_KEY
  results.GOOGLE_BOOKS_API_KEY = { set: !!booksKey }
  if (booksKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=test&maxResults=1&key=${booksKey}`
      )
      results.GOOGLE_BOOKS_API_KEY.valid = res.ok
      if (!res.ok) results.GOOGLE_BOOKS_API_KEY.error = `HTTP ${res.status}`
    } catch (e: any) {
      results.GOOGLE_BOOKS_API_KEY.valid = false
      results.GOOGLE_BOOKS_API_KEY.error = e.message
    }
  }

  // 3. GOOGLE_CLOUD_VISION_API_KEY
  const visionKey = process.env.GOOGLE_CLOUD_VISION_API_KEY
  results.GOOGLE_CLOUD_VISION_API_KEY = { set: !!visionKey }
  if (visionKey) {
    try {
      // 1x1 transparent PNG in base64
      const tinyPng =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const res = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${visionKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [
              {
                image: { content: tinyPng },
                features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
              },
            ],
          }),
        }
      )
      results.GOOGLE_CLOUD_VISION_API_KEY.valid = res.ok
      if (!res.ok) {
        const err = await res.json()
        results.GOOGLE_CLOUD_VISION_API_KEY.error = err.error?.message || `HTTP ${res.status}`
      }
    } catch (e: any) {
      results.GOOGLE_CLOUD_VISION_API_KEY.valid = false
      results.GOOGLE_CLOUD_VISION_API_KEY.error = e.message
    }
  }

  // 4. Cloudinary
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const cloudKey = process.env.CLOUDINARY_API_KEY
  const cloudSecret = process.env.CLOUDINARY_API_SECRET
  results.CLOUDINARY = { set: !!(cloudName && cloudKey && cloudSecret) }
  if (cloudName && cloudKey && cloudSecret) {
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/usage`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${cloudKey}:${cloudSecret}`).toString('base64')}`,
          },
        }
      )
      results.CLOUDINARY.valid = res.ok
      if (!res.ok) results.CLOUDINARY.error = `HTTP ${res.status}`
    } catch (e: any) {
      results.CLOUDINARY.valid = false
      results.CLOUDINARY.error = e.message
    }
  }

  return NextResponse.json(results, { status: 200 })
}
