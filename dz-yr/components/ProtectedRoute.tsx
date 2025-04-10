'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!data.session || error) {
        router.replace('/auth/login') // plus sûr que push
      } else {
        setIsAuthenticated(true)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) return <div className="p-6">Chargement...</div>

  return isAuthenticated ? <>{children}</> : null
}
