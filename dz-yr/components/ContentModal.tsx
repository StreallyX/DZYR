'use client'

import { useRef } from 'react'
import SecureContentCard from './SecureContentCard'

type Props = {
  item: any
  blob: Blob | undefined
  onClose: () => void
}

export default function ContentModal({ item, blob, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null)

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
      onClose()
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 overflow-y-auto"
    >
      <div className="bg-zinc-900 rounded shadow-lg w-full max-w-xl m-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-xl z-50"
        >
          &times;
        </button>

        <div className="p-6">
          {blob ? (
            <SecureContentCard item={item} blob={blob} />
          ) : (
            <div className="w-full h-80 bg-zinc-800 animate-pulse rounded" />
          )}
        </div>
      </div>
    </div>
  )
}
