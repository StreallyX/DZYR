'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'
import { AuthProvider } from '@/app/contexts/AuthContext'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const isMessagePage = /^\/messages\/[^/]+$/.test(pathname)
  const isLanding = pathname === '/'
  const isAuthPage = pathname.startsWith('/auth')

  const hideHeader = isMessagePage
  const hideBottomNav = isMessagePage || isLanding || isAuthPage

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('auth-token')

      // ✅ Autoriser l'accès libre à la LandingPage ("/") et /auth/*
      if (!token && !isLanding && !isAuthPage) {
        setCheckingAuth(false)
        router.push('/auth/login')
        return
      }

      if (!token) {
        setCheckingAuth(false)
        return
      }

      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        setCheckingAuth(false)
        if (!isLanding && !isAuthPage) {
          router.push('/auth/login')
        }
        return
      }

      const data = await res.json()
      setUser(data.user)
      setCheckingAuth(false)
    }

    checkUser()
  }, [router, isLanding, isAuthPage])

  if (checkingAuth && !isAuthPage && !isLanding) {
    return <div className="text-center pt-10">Chargement...</div>
  }

  return (
    <AuthProvider initialUser={user}>
      {!hideHeader && <Header />}
      <main className={`mx-auto ${hideBottomNav ? '' : 'max-w-md px-4 pt-16 pb-24'}`}>
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </AuthProvider>
  )
}
