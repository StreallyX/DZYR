'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  contentId: string
  className?: string
}

export default function SecureVideoPlayer({ contentId, className }: Props) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const userId = sessionData.session?.user.id

      if (!token || !userId) {
        setError('Utilisateur non connecté')
        return
      }

      // Get signed video URL
      const res = await fetch(`/api/video/${contentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        setVideoUrl(res.url)
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur inconnue')
      }

      // Get username for watermark
      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single()

      setUsername(profile?.username ?? null)
    }

    fetchData()
  }, [contentId])

  if (error) {
    return (
      <div className="bg-red-100 text-red-600 p-3 rounded text-sm">
        ⚠️ {error}
      </div>
    )
  }

  if (!videoUrl) {
    return <div className="text-zinc-400 text-sm">Chargement de la vidéo...</div>
  }

  return (
    <div className="relative">
      <video
        src={videoUrl}
        controls
        className={`w-full rounded pointer-events-auto select-none ${className}`}
        onContextMenu={(e) => e.preventDefault()}
      />
      {username && (
        <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded pointer-events-none select-none z-10">
          @{username} – DZYR
        </div>
      )}
    </div>
  )
}
