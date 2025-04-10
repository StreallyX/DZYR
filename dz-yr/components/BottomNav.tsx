'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, User, MessageCircle, Settings } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (path: string) =>
    pathname === path ? 'text-violet-500' : 'text-zinc-500'

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 px-8 py-3 flex justify-around items-center z-50 shadow-lg">
      <Link href="/" className={isActive('/')}>
        <Home size={26} />
      </Link>
      <Link href="/search" className={isActive('/search')}>
        <Search size={26} />
      </Link>
      <Link href="/profile" className={isActive('/profile')}>
        <User size={26} />
      </Link>
      <Link href="/messages" className={isActive('/messages')}>
        <MessageCircle size={26} />
      </Link>
      <Link href="/settings" className={isActive('/settings')}>
        <Settings size={26} />
      </Link>

    </nav>
  )
}
