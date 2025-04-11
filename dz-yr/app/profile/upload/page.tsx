'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UploadContentPage() {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [isFree, setIsFree] = useState(false)
  const [subRequired, setSubRequired] = useState(false)
  const router = useRouter()

  const handleUpload = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !file) {
      alert("Veuillez vous connecter et sélectionner un fichier.")
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `contents/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('contents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Erreur upload fichier :', uploadError)
      return
    }

    const { data } = supabase.storage.from('contents').getPublicUrl(filePath)
    const media_url = data.publicUrl

    console.log('Insertion DB', {
      user_id: user.id,
      media_url,
      description,
      price: isFree ? 0 : Number(price),
      is_free: isFree,
      sub_required: subRequired,
      created_at: new Date().toISOString(),
    })
    

    const { error: insertError } = await supabase.from('contents').insert([
      {
        user_id: user.id,
        media_url,
        description,
        price: isFree ? 0 : Number(price),
        is_free: isFree,
        sub_required: subRequired,
        created_at: new Date().toISOString(),
      },
    ])

    if (insertError) {
      console.error('Erreur insertion DB :', insertError)
      return
    }

    alert('✅ Contenu ajouté avec succès !')
    router.push('/profile')
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Ajouter un contenu</h1>

      <label className="block mb-1">Fichier image ou vidéo</label>
      <input
        type="file"
        accept="image/*,video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block mb-4 text-sm text-white"
      />

      <label className="block mb-1">Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="block w-full mb-4 bg-zinc-800 p-2 rounded"
      />

      <label className="block mb-1">Prix (€)</label>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        disabled={isFree || subRequired}
        className="block w-full mb-4 bg-zinc-800 p-2 rounded"
      />

      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
          />
          Gratuit
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={subRequired}
            onChange={(e) => setSubRequired(e.target.checked)}
          />
          Réservé aux abonnés
        </label>
      </div>

      <button
        onClick={handleUpload}
        className="bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-500"
      >
        Publier
      </button>
    </div>
  )
}
