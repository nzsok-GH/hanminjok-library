import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

function isMobileUserAgent(userAgent: string): boolean {
  return /iPhone|Android|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only handle root path redirects
  if (pathname !== '/') {
    return NextResponse.next()
  }

  // Check if user is authenticated via NextAuth session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    // Not authenticated — show login page
    return NextResponse.next()
  }

  // Authenticated: redirect based on device
  const userAgent = request.headers.get('user-agent') || ''
  const mobile = isMobileUserAgent(userAgent)
  const destination = mobile ? '/qr-scan' : '/dashboard'

  return NextResponse.redirect(new URL(destination, request.url))
}

export const config = {
  matcher: ['/', '/dashboard', '/qr-scan'],
}
