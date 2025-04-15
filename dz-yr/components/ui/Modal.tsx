'use client'

import { ReactNode } from 'react'

export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
      <div className="bg-zinc-900 p-6 rounded w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-zinc-400 hover:text-white"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}
