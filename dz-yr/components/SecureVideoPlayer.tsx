'use client'

import { useEffect, useState } from 'react'

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
      const token = localStorage.getItem('auth-token')
      if (!token) {
        setError('Utilisateur non connecté')
        return
      }

      try {
        // 🔐 Récupère l'utilisateur (pour le watermark)
        const userRes = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!userRes.ok) {
          setError('Utilisateur non authentifié')
          return
        }

        const { user } = await userRes.json()
        setUsername(user.username)

        // 🎬 Récupère la vidéo protégée
        const videoRes = await fetch(`/api/video/${contentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!videoRes.ok) {
          const err = await videoRes.json()
          setError(err.error || 'Erreur vidéo')
          return
        }

        setVideoUrl(videoRes.url) // <- pour redirect 302, ce sera null, donc on force ci-dessous
        setVideoUrl(videoRes.url || videoRes.headers.get('location') || videoRes.url)
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue')
      }
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
