'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditContentPage() {
  const { id } = useParams()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('contents')
        .select('title, description')
        .eq('id', id)
        .single()

      if (error || !data) {
        setError("Contenu introuvable")
      } else {
        setTitle(data.title || '')
        setDescription(data.description || '')
      }
      setLoading(false)
    }

    if (id) fetchContent()
  }, [id])

  const handleUpdate = async () => {
    setError('')
    const { error } = await supabase
      .from('contents')
      .update({ title, description })
      .eq('id', id)

    if (error) {
      setError("Erreur lors de la mise à jour")
    } else {
      alert('Contenu mis à jour ✅')
      router.push('/profile') // redirige ou actualise
    }
  }

  if (loading) return <div className="p-6 text-center">Chargement...</div>

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Modifier le contenu</h1>

      <label className="block mb-2 text-sm font-medium text-white">Titre</label>
      <input
        className="w-full mb-4 p-2 rounded bg-zinc-800 text-white"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label className="block mb-2 text-sm font-medium text-white">Description</label>
      <textarea
        className="w-full mb-4 p-2 rounded bg-zinc-800 text-white"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        onClick={handleUpdate}
        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded"
      >
        Sauvegarder
      </button>
    </div>
  )
}