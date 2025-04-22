'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BackButton from '@/components/ui/BackButton'
import { useAuth } from '@/app/contexts/AuthContext'

export default function UploadContentPage() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [accessType, setAccessType] = useState<'free' | 'subscription' | 'paid'>('free')

  const router = useRouter()

  const handleUpload = async () => {
    if (!user || !file || !title.trim()) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = fileName

    const mimeType = file.type
    const mediaType = mimeType.startsWith('image')
      ? 'image'
      : mimeType.startsWith('video')
      ? 'video'
      : 'other'

    const { error: uploadError } = await supabase.storage
      .from('contents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Erreur upload fichier :', uploadError)
      return
    }

    const contentData = {
      user_id: user.id,
      title,
      description,
      media_path: filePath,
      media_type: mediaType,
      created_at: new Date().toISOString(),
      price: accessType === 'paid' ? price : 0,
      is_free: accessType === 'free',
      sub_required: accessType === 'subscription',
      is_shop_item: accessType === 'paid',
    }

    const { error: insertError } = await supabase.from('contents').insert([contentData])
    if (insertError) {
      console.error('Erreur insertion DB :', insertError)
    } else {
      alert('Contenu ajouté ✅')
      router.push('/profile')
    }
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <BackButton />

      <h1 className="text-xl font-bold mb-4 text-white">Ajouter un contenu</h1>

      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mb-4 text-white"
      />

      <input
        type="text"
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="block w-full mb-4 bg-zinc-800 p-2 rounded text-white"
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="block w-full mb-4 bg-zinc-800 p-2 rounded text-white"
      />

      <label className="block text-sm text-white mb-2">
        Type d'accès :
        <select
          value={accessType}
          onChange={(e) => setAccessType(e.target.value as 'free' | 'subscription' | 'paid')}
          className="block w-full bg-zinc-800 p-2 rounded mt-1 text-white"
        >
          <option value="free">Gratuit</option>
          <option value="subscription">Abonnement requis</option>
          <option value="paid">Payant à l’unité</option>
        </select>
      </label>

      {accessType === 'paid' && (
        <label className="block text-sm text-white mb-2">
          Prix (€)
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="block w-full bg-zinc-800 p-2 rounded mt-1"
          />
        </label>
      )}

      <button
        onClick={handleUpload}
        className="mt-4 bg-violet-600 text-white px-4 py-2 rounded w-full"
      >
        Upload
      </button>
    </div>
  )
}
