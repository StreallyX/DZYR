import './globals.css'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'DZYR',
  description: 'La plateforme créateur nouvelle génération',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-black text-white min-h-screen pt-16 pb-24">
        <Header />
        <main className="max-w-md mx-auto px-4">{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
