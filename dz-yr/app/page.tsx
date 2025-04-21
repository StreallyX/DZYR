'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace('/home') // redirige vers le dashboard si connecté
      } else {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  if (loading) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold mb-4 text-violet-400">Bienvenue sur DZYR</h1>
      <p className="text-lg max-w-xl mb-6 text-gray-300">
        La plateforme moderne pour vendre ton contenu, gérer tes abonnés et construire ta communauté.
      </p>
      <button
        onClick={() => router.push('/auth/login')}
        className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-lg font-semibold transition"
      >
        Commencer
      </button>
    </div>
  )
}
