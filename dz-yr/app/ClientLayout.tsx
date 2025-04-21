'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isMessagePage = /^\/messages\/[^/]+$/.test(pathname)
  const isLanding = pathname === '/'
  const isAuth = pathname === '/auth/login'

  const hideHeader = isMessagePage
  const hideBottomNav = isMessagePage || isLanding || isAuth

  return (
    <>
      {!hideHeader && <Header />}

      <main className={`mx-auto ${hideBottomNav ? '' : 'max-w-md px-4 pt-16 pb-24'}`}>
        {children}
      </main>

      {!hideBottomNav && <BottomNav />}
    </>
  )
}
