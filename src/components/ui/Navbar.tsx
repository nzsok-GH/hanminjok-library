'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

const navItems = [
  { href: '/qr-scan',   label: '대출/반납', icon: '📱' },
  { href: '/books',     label: '도서',      icon: '📚' },
  { href: '/students',  label: '학생',      icon: '👨‍👧‍👦' },
  { href: '/loans',     label: '내역',      icon: '📋' },
  { href: '/reports',   label: '통계',      icon: '📊' },
]

// ─── Mobile Bottom Navigation ─────────────────────────────────────────────────
export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                active
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Desktop Sidebar Navigation ───────────────────────────────────────────────
export function DesktopSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-gray-900 text-white p-4 gap-2 shrink-0">
      {/* Logo / School name */}
      <div className="mb-6 px-2">
        <p className="text-xs text-gray-400 leading-tight">한민족 한글학교</p>
        <h1 className="text-lg font-bold leading-tight">📖 도서관</h1>
      </div>

      {/* Nav links */}
      {navItems.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
          </Link>
        )
      })}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User info + logout */}
      {session?.user && (
        <div className="border-t border-gray-700 pt-3 mt-2">
          <p className="text-xs text-gray-400 truncate px-2 mb-2">
            {session.user.name || session.user.email}
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            🚪 로그아웃
          </button>
        </div>
      )}
    </aside>
  )
}

// ─── Default export: auto-selects based on context ───────────────────────────
export default function Navbar() {
  return (
    <>
      <DesktopSidebar />
      <MobileNav />
    </>
  )
}
