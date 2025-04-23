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
        const userRes = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!userRes.ok) {
          const contentType = userRes.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const err = await userRes.json()
            throw new Error(err?.error || 'Utilisateur non authentifié')
          } else {
            throw new Error('Réponse non JSON (auth/me)')
          }
        }

        const { user } = await userRes.json()
        setUsername(user.username)

        const videoRes = await fetch(`/api/video/${contentId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!videoRes.ok) {
          const contentType = videoRes.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const err = await videoRes.json()
            throw new Error(err?.error || 'Erreur vidéo')
          } else {
            throw new Error('Erreur inconnue (non JSON)')
          }
        }

        const redirectedUrl =
          videoRes.url || videoRes.headers.get('location') || null

        if (!redirectedUrl) {
          throw new Error("URL de la vidéo non trouvée.")
        }

        setVideoUrl(redirectedUrl)
      } catch (err: any) {
        console.error('[SecureVideoPlayer]', err)
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
