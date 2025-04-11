'use client'

import { useEffect, useRef } from 'react'

interface SecureImageProps {
  blob: Blob
  width?: number
  height?: number
  className?: string
}

export default function SecureImageViewer({ blob, width = 300, height = 300, className = '' }: SecureImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = URL.createObjectURL(blob)

    return () => URL.revokeObjectURL(img.src)
  }, [blob])

  // Protection contre clic droit, drag, touche, etc.
  useEffect(() => {
    const prevent = (e: Event) => {
      e.preventDefault()
    }

    const blockKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ['s', 'S', 'u', 'U', 'c', 'C', 'p', 'P'].includes(e.key)
      ) {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', prevent)
    document.addEventListener('dragstart', prevent)
    document.addEventListener('keydown', blockKey)

    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('dragstart', prevent)
      document.removeEventListener('keydown', blockKey)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded shadow-lg bg-black ${className}`}
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    />
  )
}
