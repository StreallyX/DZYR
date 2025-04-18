'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideLayout = /^\/messages\/[^/]+$/.test(pathname)

  return (
    <>
      {!hideLayout && <Header />}
      <main className={`mx-auto ${hideLayout ? '' : 'max-w-md px-4 pt-16 pb-24'}`}>
        {children}
      </main>
      {!hideLayout && <BottomNav />}
    </>
  )
}
