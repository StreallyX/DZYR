import './globals.css'
import type { Metadata } from 'next'
import ClientLayout from './ClientLayout'

export const metadata: Metadata = {
  title: 'DZYR',
  description: 'La plateforme créateur nouvelle génération',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-black text-white min-h-screen">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
