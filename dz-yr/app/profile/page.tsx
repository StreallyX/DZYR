'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: userData } = await supabase.auth.getUser()
      setUser(userData.user)

      if (userData.user) {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userData.user.id)
          .single()
        setProfile(profileData)
      }
    }

    fetchUserAndProfile()
  }, [])

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Mon profil</h1>
      {user && profile ? (
        <>
          <p>Utilisateur : {profile.username}</p>
          <p>Email : {user.email}</p>
          <p>Bio : {profile.bio ?? 'Aucune bio encore'}</p>
        </>
      ) : (
        <p>Chargement...</p>
      )}
    </div>
  )
}
