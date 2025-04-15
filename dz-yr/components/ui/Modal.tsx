'use client'

import { ReactNode } from 'react'

export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center overflow-y-auto">
      <div className="bg-zinc-900 rounded-lg w-full max-w-xl m-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-zinc-400 hover:text-white z-50"
        >
          ✕
        </button>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
