'use client'

import { useEffect, useRef, useState } from 'react'

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
      const token = localStorage.getItem('auth-token')
      console.log('[SecureImageViewer] Token récupéré :', token)
    
      if (!token) {
        setError('Non connecté (pas de token)')
        return
      }
    
      try {
        const userRes = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
    
        console.log('[SecureImageViewer] /api/auth/me status:', userRes.status)
        const userJson = await userRes.json()
        console.log('[SecureImageViewer] /api/auth/me response:', userJson)
    
        if (!userRes.ok) throw new Error(userJson?.error || 'Utilisateur non connecté')
        const { user } = userJson
        setUsername(user.username)
    
        const imageRes = await fetch(`/api/generate-image?path=${encodeURIComponent(path)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
    
        if (!imageRes.ok) {
          const err = await imageRes.json()
          throw new Error(err.error || 'Erreur chargement image')
        }
    
        const blob = await imageRes.blob()
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
    
          URL.revokeObjectURL(imageUrl)
        }
        img.src = imageUrl
      } catch (err: any) {
        console.error('[SecureImageViewer] Erreur loadImage :', err)
        setError(err.message)
      }
    }
    
    // Delay to allow AuthContext/init to settle
    const timeout = setTimeout(loadImage, 200)
    return () => clearTimeout(timeout)
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
