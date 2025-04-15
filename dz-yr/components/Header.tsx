'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const isProfilePage = pathname === '/profile'

  return (
    <header className="fixed top-0 left-0 right-0 bg-black border-b border-zinc-800 flex justify-between items-center px-6 py-3 z-50 shadow-sm">
      <Link href="/" className="text-2xl font-bold text-violet-500 tracking-wider">
        DZYR
      </Link>

      {/* Settings visible uniquement sur la page /profile */}
      {isProfilePage && (
        <Link href="/settings">
          <button className="text-xs text-white bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded">
            ⚙️ Settings
          </button>
        </Link>
      )}
    </header>
  )
}
