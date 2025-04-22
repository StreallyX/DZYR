'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext<any>(null)

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode
  initialUser?: any
}) {
  const [user, setUser] = useState<any>(initialUser)
  const [loading, setLoading] = useState(initialUser === null)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        console.warn('[AUTH] Pas de token trouvé.')
        setUser(null)
        setLoading(false)
        router.push('/auth/login')
        return
      }

      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        console.warn('[AUTH] Token invalide, suppression.')
        localStorage.removeItem('auth-token')
        setUser(null)
        setLoading(false)
        router.push('/auth/login')
        return
      }

      const data = await res.json()
      setUser(data.user)
      setLoading(false)

      console.log('[AUTH] ✅ Utilisateur authentifié :', data.user)
    }

    if (!initialUser) fetchUser()
    else setLoading(false)
  }, [initialUser, router])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
