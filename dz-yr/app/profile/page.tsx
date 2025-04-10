'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userData.user?.id)
        .single()
      setProfile(profileData)
    }

    fetchProfile()
  }, [])

  return (
    <ProtectedRoute>
    <div className="pt-4">
      <h1 className="text-xl font-bold mb-2">Mon profil</h1>
      {profile ? (
        <div className="bg-white p-4 rounded shadow">
          <p className="mb-1"><strong>Nom :</strong> {profile.username}</p>
          <p className="mb-1"><strong>Bio :</strong> {profile.bio ?? 'Aucune bio'}</p>
          {/* Plus tard : ajouter "Gérer mes contenus", "Revenus", etc. */}
        </div>
      ) : (
        <p>Chargement...</p>
      )}
    </div>
    </ProtectedRoute>
  )
}
