'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

/**
 * Client-side fallback redirect based on viewport width.
 * Handles cases the middleware can't catch (e.g., cached responses, PWA installs).
 * Mount this in the root layout so it runs on every page.
 */
export default function DeviceRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const { status } = useSession()

  useEffect(() => {
    // Only redirect authenticated users from the root path
    if (status !== 'authenticated' || pathname !== '/') return

    const isMobile = window.innerWidth < 768
    router.replace(isMobile ? '/qr-scan' : '/dashboard')
  }, [status, pathname, router])

  return null
}
