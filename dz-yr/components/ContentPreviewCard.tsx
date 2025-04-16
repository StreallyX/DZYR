'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import SecureContentCard from '@/components/SecureContentCard'
import LockedContentModal from '@/components/LockedContentModal'

type Props = {
  item: any
  signedUrl?: string
  blobMap: Record<string, Blob>
  canView: boolean
  creator: any
  onUnlocked?: () => void // callback pour refresh
}

export default function ContentPreviewCard({
  item,
  signedUrl,
  blobMap,
  canView,
  creator,
  onUnlocked,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      <div
        onClick={handleClick}
        className="bg-zinc-800 rounded-xl overflow-hidden shadow-md cursor-pointer hover:bg-zinc-700 transition-all"
      >
        {signedUrl ? (
          <img
            src={signedUrl}
            alt="content"
            className={`w-full h-64 object-cover transition-all duration-200 ${
              canView ? '' : 'blur-[6px] scale-105'
            }`}
          />
        ) : (
          <div className="w-full h-64 bg-zinc-700 flex items-center justify-center text-white">
            Aucun aperçu
          </div>
        )}

        <div className="p-4">
          <p className="text-sm text-white mb-1">
            {item.description || <i>Aucune description</i>}
          </p>

          <p className="text-xs text-zinc-400">
            {item.sub_required
              ? 'Abonnement requis'
              : item.is_free
              ? 'Gratuit'
              : `${item.price} €`}
          </p>

          {!canView && (
            <p className="mt-2 text-xs text-red-400 font-semibold">
              🔒 Contenu verrouillé
            </p>
          )}
        </div>
      </div>

      {/* Modal auto */}
      {isOpen && canView && blobMap[item.id] && (
        <Modal onClose={handleClose}>
          <SecureContentCard item={item} blob={blobMap[item.id]} />
        </Modal>
      )}

      {isOpen && !canView && (
        <LockedContentModal
          item={item}
          creator={creator}
          onClose={handleClose}
          onUnlocked={onUnlocked || (() => {})}
        />
      )}
    </>
  )
}
