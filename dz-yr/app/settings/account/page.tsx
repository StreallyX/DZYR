'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BackButton from '@/components/ui/BackButton'
import Image from 'next/image'

export default function AccountSettingsPage() {
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
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id
      if (!userId) return

      const { data: profileData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .limit(1)

      if (error || !profileData || profileData.length === 0) {
        console.error('Profil introuvable', error)
        return
      }

      const profile = profileData[0]
      setProfile(profile)
      setBio(profile.bio || '')
      setPrice(profile.subscription_price?.toString() || '')
      setAvatarUrl(profile.avatar_url || '')
      setBannerUrl(profile.banner_url || '')
    }

    fetchProfile()
  }, [])

  const deleteFileFromStorage = async (url: string, bucket: string) => {
    const parts = url.split('/')
    const fileName = parts[parts.length - 1]
    const path = fileName


    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) console.error(`Erreur suppression image de ${bucket}`, error)
  }

  const uploadImage = async (file: File, folder: string, userId: string) => {
    const ext = file.name.split('.').pop()
    const filename = `${userId}-${Date.now()}.${ext}`
    const path = `${filename}`

    const { error } = await supabase.storage
      .from(folder)
      .upload(path, file, { upsert: true })

    if (error) throw error

    const { data } = supabase.storage.from(folder).getPublicUrl(path)
    return { publicUrl: data.publicUrl, filePath: path }
  }

  const handleSave = async () => {
    if (!profile) return

    let newAvatarUrl = avatarUrl
    let newBannerUrl = bannerUrl

    try {
      // Supprimer ancienne avatar si nécessaire
      if (removeAvatar && avatarUrl) {
        await deleteFileFromStorage(avatarUrl, 'avatars')
        newAvatarUrl = ''
      } else if (avatar) {
        if (avatarUrl) await deleteFileFromStorage(avatarUrl, 'avatars')
        const upload = await uploadImage(avatar, 'avatars', profile.id)
        newAvatarUrl = upload.publicUrl
      }

      // Supprimer ancienne bannière si nécessaire
      if (removeBanner && bannerUrl) {
        await deleteFileFromStorage(bannerUrl, 'banners')
        newBannerUrl = ''
      } else if (banner) {
        if (bannerUrl) await deleteFileFromStorage(bannerUrl, 'banners')
        const upload = await uploadImage(banner, 'banners', profile.id)
        newBannerUrl = upload.publicUrl
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

      if (updateError) {
        console.error('Erreur mise à jour profil :', updateError)
        return
      }

      alert('Profil mis à jour ✅')
    } catch (err) {
      console.error('Erreur upload image :', err)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    window.location.href = '/'
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <BackButton />
      <h1 className="text-3xl font-bold mb-6">Modifier mon compte</h1>

      {/* Banner */}
      {bannerUrl && !removeBanner && (
        <div className="mb-2 w-full h-40 rounded-lg overflow-hidden relative">
          <Image src={bannerUrl} alt="Bannière" fill className="object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setBanner(e.target.files?.[0] ?? null)
            setRemoveBanner(false)
          }}
          className="file:bg-violet-600 file:text-white file:rounded file:px-3 file:py-1"
        />
        {bannerUrl && !removeBanner && (
          <button onClick={() => setRemoveBanner(true)} className="text-red-500 text-sm hover:underline">
            Supprimer bannière
          </button>
        )}
      </div>

      {/* Avatar */}
      {avatarUrl && !removeAvatar && (
        <div className="mb-2 w-24 h-24 rounded-full overflow-hidden border-2 border-violet-600">
          <Image src={avatarUrl} alt="Avatar" width={96} height={96} className="object-cover" />
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setAvatar(e.target.files?.[0] ?? null)
            setRemoveAvatar(false)
          }}
          className="file:bg-violet-600 file:text-white file:rounded file:px-3 file:py-1"
        />
        {avatarUrl && !removeAvatar && (
          <button onClick={() => setRemoveAvatar(true)} className="text-red-500 text-sm hover:underline">
            Supprimer avatar
          </button>
        )}
      </div>

      {/* Bio */}
      <label className="block mb-1 text-sm text-zinc-400">Bio</label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        className="w-full p-3 rounded bg-zinc-800 text-white mb-4"
      />

      {/* Price */}
      <label className="block mb-1 text-sm text-zinc-400">Prix abonnement (€)</label>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full p-3 rounded bg-zinc-800 text-white mb-6"
      />

      <button
        onClick={handleSave}
        className="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2 px-6 rounded w-full mb-6"
      >
        Enregistrer les modifications
      </button>

      <button
        onClick={handleLogout}
        className="text-red-500 hover:underline text-sm"
      >
        Se déconnecter
      </button>
    </div>
  )
}
