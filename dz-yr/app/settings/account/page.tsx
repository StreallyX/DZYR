'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BackButton from '@/components/ui/BackButton'

export default function AccountSettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [bio, setBio] = useState('')
  const [price, setPrice] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [username, setUsername] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id
      if (!userId) return

      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .limit(1)

      if (error || !profileData || profileData.length === 0) {
        console.error('Profil introuvable', error)
        return
      }

      const profile = profileData[0]
      setProfile(profile)
      setBio(profile.bio)
      setPrice(profile.subscription_price)
      setUsername(profile.username)
    }

    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (!profile) return

    let avatar_url = profile.avatar_url

    if (avatar) {
      const fileExt = avatar.name.split('.').pop()
      const fileName = `${profile.user_id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatar, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Erreur upload avatar :', uploadError)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      avatar_url = data.publicUrl
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        bio,
        subscription_price: Number(price),
        avatar_url,
      })
      .eq('user_id', profile.user_id)

    if (updateError) {
      console.error('Erreur mise à jour profil :', updateError)
      return
    }

    alert('Profil mis à jour ✅')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' // Redirection
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
        <BackButton />
      <h1 className="text-2xl font-bold mb-6">Mon compte</h1>

      <p className="text-sm text-zinc-400 mb-4">
        Pseudo : <span className="text-white font-semibold">{username}</span>
      </p>

      <label className="block mb-1">Bio</label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        className="block w-full mb-4 bg-zinc-800 p-2 rounded"
      />

      <label className="block mb-1">Prix abonnement (€)</label>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="block w-full mb-4 bg-zinc-800 p-2 rounded"
      />

      <label className="block mb-1">Photo de profil</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
        className="block mb-4 text-sm text-white"
      />

      <button
        onClick={handleSave}
        className="bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-500"
      >
        Enregistrer
      </button>

      <div className="mt-10">
        <button
          onClick={handleLogout}
          className="text-red-500 hover:underline text-sm font-semibold"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
