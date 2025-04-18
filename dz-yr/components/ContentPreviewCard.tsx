'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import SecureContentCard from '@/components/SecureContentCard'
import LockedContentModal from '@/components/LockedContentModal'

interface Props {
  contentId: string
  viewer: any
  onUnlocked?: () => void
}

export default function ContentPreviewCard({ contentId, viewer, onUnlocked }: Props) {
  const [content, setContent] = useState<any>(null)
  const [signedUrl, setSignedUrl] = useState<string>('')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [canView, setCanView] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data: contentData } = await supabase
        .from('contents')
        .select('*')
        .eq('id', contentId)
        .single()

      if (!contentData) return
      setContent(contentData)

      const requiresSub = contentData.sub_required === true
      const requiresPurchase = !contentData.is_free && !contentData.sub_required

      const isSubscribed = viewer.subscribedTo?.includes(contentData.user_id)
      const isPurchased = viewer.purchasedContentIds?.includes(contentId)
      const isOwner = contentData.user_id === viewer.id
      const isFree = contentData.is_free === true

      const canAccess =
        isFree ||
        isOwner ||
        (requiresSub && isSubscribed) ||
        (requiresPurchase && isPurchased)

      setCanView(canAccess)

      // 🔓 Génére TOUJOURS un signedUrl pour afficher un aperçu, flouté ou non
      if (contentData.media_path) {
        const { data: signed } = await supabase.storage
          .from('contents')
          .createSignedUrl(contentData.media_path, 3600)

        const finalUrl = signed?.signedUrl ?? ''
        setSignedUrl(finalUrl)

        // 🔐 On charge le blob SEULEMENT si l'utilisateur peut le voir
        if (canAccess && finalUrl) {
          const res = await fetch(finalUrl)
          const blobData = await res.blob()
          setBlob(blobData)
        }
      }
    }

    fetchData()
  }, [contentId, viewer])

  if (!content) return null

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
            {content.description || <i>Aucune description</i>}
          </p>

          <p className="text-xs text-zinc-400">
            {content.sub_required
              ? 'Abonnement requis'
              : content.is_free
              ? 'Gratuit'
              : `${content.price} €`}
          </p>

          {!canView && (
            <p className="mt-2 text-xs text-red-400 font-semibold">
              🔒 Contenu verrouillé
            </p>
          )}
        </div>
      </div>

      {isOpen && canView && blob && (
        <Modal onClose={handleClose}>
          <SecureContentCard item={content} blob={blob} />
        </Modal>
      )}

      {isOpen && !canView && (
        <LockedContentModal
          item={content}
          creator={{ username: 'creator' }}
          onClose={handleClose}
          onUnlocked={onUnlocked || (() => {})}
        />
      )}
    </>
  )
} 