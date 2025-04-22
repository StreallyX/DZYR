'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function HomePage() {
  const [profiles, setProfiles] = useState<any[]>([])

  useEffect(() => {
    const fetchProfiles = async () => {
      const token = localStorage.getItem('auth-token')
      if (!token) return

      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      if (!res.ok || !data.user) return

      // ✅ Si connecté → on récupère les profils
      const { data: users } = await supabase
        .from('users')
        .select('*')

      setProfiles(users || [])
    }

    fetchProfiles()
  }, [])

  return (

      <div className="pt-4">
        <h1 className="text-2xl font-bold mb-4">Créateurs populaires</h1>
        <div className="grid grid-cols-2 gap-4">
          {profiles.map((user) => (
            <Link key={user.id} href={`/creator/${user.username}`}>
              <div className="bg-white rounded-xl p-4 shadow hover:shadow-md">
                <div className="font-semibold">@{user.username}</div>
                <p className="text-xs text-gray-500">{user.bio ?? 'Pas de bio'}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

  )
}
