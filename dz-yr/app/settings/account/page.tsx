'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import BackButton from '@/components/ui/BackButton'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AccountSettingsPage() {
  const { user, setUser } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [bio, setBio] = useState('')
  const [price, setPrice] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [banner, setBanner] = useState<File | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [removeBanner, setRemoveBanner] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        router.push('/auth/login')
        return
      }

      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profileData) {
        console.error('Profil introuvable', error)
        return
      }

      setProfile(profileData)
      setBio(profileData.bio || '')
      setPrice(profileData.subscription_price?.toString() || '')
      setAvatarUrl(profileData.avatar_url || '')
      setBannerUrl(profileData.banner_url || '')
    }

    fetchProfile()
  }, [user, router])

  const deleteFile = async (url: string, bucket: string) => {
    const fileName = url.split('/').pop()
    await supabase.storage.from(bucket).remove([fileName || ''])
  }

  const uploadImage = async (file: File, bucket: string, userId: string) => {
    const ext = file.name.split('.').pop()
    const path = `${userId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const handleSave = async () => {
    if (!profile) return

    let newAvatarUrl = avatarUrl
    let newBannerUrl = bannerUrl

    try {
      if (removeAvatar && avatarUrl) {
        await deleteFile(avatarUrl, 'avatars')
        newAvatarUrl = ''
      } else if (avatar) {
        if (avatarUrl) await deleteFile(avatarUrl, 'avatars')
        newAvatarUrl = await uploadImage(avatar, 'avatars', profile.id)
      }

      if (removeBanner && bannerUrl) {
        await deleteFile(bannerUrl, 'banners')
        newBannerUrl = ''
      } else if (banner) {
        if (bannerUrl) await deleteFile(bannerUrl, 'banners')
        newBannerUrl = await uploadImage(banner, 'banners', profile.id)
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          bio,
          subscription_price: Number(price),
          avatar_url: newAvatarUrl,
          banner_url: newBannerUrl,
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      alert('Profil mis à jour ✅')
    } catch (err) {
      console.error('Erreur :', err)
      alert('Erreur lors de la mise à jour.')
    }
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('auth-token')
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    }
  
    localStorage.clear() // ✅ tout supprimer
    window.location.href = '/auth/login' // ✅ forcer le redirect propre
  }
  

  if (!profile) return <div className="text-center mt-12">Chargement...</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton />
      <h1 className="text-3xl font-bold mb-6">Modifier mon compte</h1>

      {/* BANNIÈRE */}
      {bannerUrl && !removeBanner && (
        <div className="mb-2 w-full h-40 rounded-lg overflow-hidden relative">
          <Image src={bannerUrl} alt="Bannière" fill className="object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <input type="file" accept="image/*" onChange={(e) => {
          setBanner(e.target.files?.[0] ?? null)
          setRemoveBanner(false)
        }} />
        {bannerUrl && !removeBanner && (
          <button onClick={() => setRemoveBanner(true)} className="text-red-500 text-sm">Supprimer bannière</button>
        )}
      </div>

      {/* AVATAR */}
      {avatarUrl && !removeAvatar && (
        <div className="mb-2 w-24 h-24 rounded-full overflow-hidden border-2 border-violet-600">
          <Image src={avatarUrl} alt="Avatar" width={96} height={96} className="object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <input type="file" accept="image/*" onChange={(e) => {
          setAvatar(e.target.files?.[0] ?? null)
          setRemoveAvatar(false)
        }} />
        {avatarUrl && !removeAvatar && (
          <button onClick={() => setRemoveAvatar(true)} className="text-red-500 text-sm">Supprimer avatar</button>
        )}
      </div>

      {/* BIO */}
      <label className="block mb-1 text-sm text-zinc-400">Bio</label>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-3 rounded bg-zinc-800 text-white mb-4" />

      {/* PRIX */}
      <label className="block mb-1 text-sm text-zinc-400">Prix abonnement (€)</label>
      <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-3 rounded bg-zinc-800 text-white mb-6" />

      {/* BOUTONS */}
      <button onClick={handleSave} className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2 px-6 rounded w-full mb-6">
        Enregistrer les modifications
      </button>

      <button onClick={handleLogout} className="text-red-500 hover:underline text-sm">
        Se déconnecter
      </button>
    </div>
  )
}
