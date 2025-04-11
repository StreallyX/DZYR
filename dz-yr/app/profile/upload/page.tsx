'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UploadContentPage() {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [isFree, setIsFree] = useState(false)
  const [subRequired, setSubRequired] = useState(false)
  const router = useRouter()

  const handleUpload = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !file) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = fileName

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

    const { error: insertError } = await supabase.from('contents').insert([
      {
        user_id: user.id,
        description,
        price,
        is_free: isFree,
        sub_required: subRequired,
        media_path: filePath, // ⬅️ ceci est essentiel
        created_at: new Date().toISOString(),
      },
    ])

    if (insertError) {
      console.error('Erreur insertion DB :', insertError)
    } else {
      alert('Contenu ajouté ✅')
      router.push('/profile')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Ajouter un contenu</h1>

      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mb-4"
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="block w-full mb-4 bg-zinc-800 p-2 rounded text-white"
      />

      <label className="block text-sm text-white mb-2">
        Prix (€)
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="block w-full bg-zinc-800 p-2 rounded mt-1"
        />
      </label>

      <label className="block text-sm text-white mt-2">
        <input
          type="checkbox"
          checked={isFree}
          onChange={() => setIsFree(!isFree)}
        />{' '}
        Gratuit ?
      </label>

      <label className="block text-sm text-white mt-2">
        <input
          type="checkbox"
          checked={subRequired}
          onChange={() => setSubRequired(!subRequired)}
        />{' '}
        Abonnement requis ?
      </label>

      <button
        onClick={handleUpload}
        className="mt-4 bg-violet-600 text-white px-4 py-2 rounded"
      >
        Upload
      </button>
    </div>
  )
}
