'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [bio, setBio] = useState('')
  const [price, setPrice] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userData.user?.id)
        .single()
      setProfile(profileData)
      setBio(profileData?.bio ?? '')
      setPrice(profileData?.subscription_price ?? '')
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    
    if (!profile) {
        alert('Profil introuvable')
        return
    }
      
    let avatar_url = profile.avatar_url
      

    if (avatar) {
      const filePath = `avatars/${profile.user_id}-${Date.now()}`
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatar, {
          cacheControl: '3600',
          upsert: true,
        })

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        avatar_url = urlData.publicUrl
      }
    }

    await supabase
      .from('users')
      .update({ bio, subscription_price: price, avatar_url })
      .eq('user_id', profile.user_id)

    setLoading(false)
    alert('Profil mis à jour !')
  }

  return (
    <ProtectedRoute>
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Modifier mon profil</h1>

        <label className="block text-sm text-zinc-300 mb-2">Bio</label>
        <textarea
          className="w-full p-2 rounded bg-zinc-800 mb-4"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <label className="block text-sm text-zinc-300 mb-2">Prix abonnement / mois (€)</label>
        <input
          type="number"
          className="w-full p-2 rounded bg-zinc-800 mb-4"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <label className="block text-sm text-zinc-300 mb-2">Photo de profil</label>
        <input
          type="file"
          accept="image/*"
          className="mb-4"
          onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
        />

        <button
          onClick={handleSave}
          className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded text-sm"
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </ProtectedRoute>
  )
}
