'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  path: string // media_path depuis Supabase
  className?: string
}

export default function SecureImageViewer({ path, className }: Props) {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUrl = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const userId = sessionData.session?.user.id

      if (!token || !userId) {
        setError('Non connecté')
        return
      }

      const res = await fetch(`/api/generate-image?path=${encodeURIComponent(path)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        setImgUrl(res.url)
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur image')
      }

      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single()

      setUsername(profile?.username ?? null)
    }

    fetchUrl()
  }, [path])

  if (error) return <div className="text-red-500 text-sm">⚠️ {error}</div>
  if (!imgUrl) return <div className="text-zinc-400 text-sm">Chargement de l'image...</div>

  return (
    <div
      className={`relative w-full flex items-center justify-center bg-black overflow-hidden rounded ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <img
        src={imgUrl}
        alt="Contenu sécurisé"
        className="max-w-full max-h-[75vh] object-contain pointer-events-none select-none"
        draggable={false}
      />

      {/* Overlay watermark */}
      {username && (
        <div className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded pointer-events-none select-none z-10">
          @{username} – DZYR
        </div>
      )}

      {/* Overlay transparent anti-clic */}
      <div className="absolute inset-0 pointer-events-none z-0" />
    </div>
  )
}
