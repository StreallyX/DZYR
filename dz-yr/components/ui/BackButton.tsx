'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton({ label = 'Retour' }: { label?: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center text-sm text-zinc-400 hover:text-white mb-6"
    >
      <ArrowLeft className="w-4 h-4 mr-1" />
      {label}
    </button>
  )
}
