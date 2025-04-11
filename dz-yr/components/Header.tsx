'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

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

  return (
    <header className="fixed top-0 left-0 right-0 bg-black border-b border-zinc-800 flex justify-between items-center px-6 py-3 z-50 shadow-sm">
      <Link href="/" className="text-2xl font-bold text-violet-500 tracking-wider">
        DZYR
      </Link>
      {user?.email && (
        <div className="absolute top-4 right-4 text-xs text-zinc-400">
          Connecté : {user.email}
        </div>
      )}
      <button
        onClick={handleLogout}
        className="text-xs text-white bg-violet-600 hover:bg-violet-500 px-3 py-1 rounded transition"
      >
        Déconnexion
      </button>
    </header>
  )
}