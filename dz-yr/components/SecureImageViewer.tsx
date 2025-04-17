'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  path: string
  className?: string
}

export default function SecureImageViewer({ path, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const loadImage = async () => {
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

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur image')
        return
      }

      const blob = await res.blob()
      const imageUrl = URL.createObjectURL(blob)

      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height

        ctx.drawImage(img, 0, 0)

        // Watermark visible
        //ctx.font = '20px Arial'
        //ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        //ctx.textAlign = 'left'
        //ctx.fillText(`@${username ?? 'user'} – DZYR`, 10, canvas.height - 10)

        URL.revokeObjectURL(imageUrl)
      }
      img.src = imageUrl

      // Get username
      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single()

      setUsername(profile?.username ?? null)
    }

    loadImage()
  }, [path])

  if (error) return <div className="text-red-500 text-sm">⚠️ {error}</div>

  return (
    <div
      className={`relative w-full flex justify-center items-center bg-black overflow-hidden rounded ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-[75vh] object-contain pointer-events-none select-none"
      />
    </div>
  )
}
