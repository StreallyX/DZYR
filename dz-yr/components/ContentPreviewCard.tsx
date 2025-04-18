'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import SecureContentCard from '@/components/SecureContentCard'
import LockedContentModal from '@/components/LockedContentModal'
import SecureImageViewer from '@/components/SecureImageViewer'


interface Props {
  contentId: string
  viewer: any
  onUnlocked?: () => void
}

export default function ContentPreviewCard({ contentId, viewer, onUnlocked }: Props) {
  const [content, setContent] = useState<any>(null)
  const [creator, setCreator] = useState<any>(null)
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

      if (contentData.media_path) {
        const { data: signed } = await supabase.storage
          .from('contents')
          .createSignedUrl(contentData.media_path, 3600)

        const url = signed?.signedUrl
        setSignedUrl(url ?? '')

        if (canAccess && url && !url.endsWith('.mp4')) {
          const res = await fetch(url)
          const blobData = await res.blob()
          setBlob(blobData)
        }
      }
    }

    fetchData()
  }, [contentId, viewer])

  useEffect(() => {
    const fetchCreator = async () => {
      if (!content?.user_id) return

      const { data: creatorData } = await supabase
        .from('users')
        .select('*')
        .eq('id', content.user_id)
        .single()

      setCreator(creatorData)
    }

    if (content?.user_id) fetchCreator()
  }, [content])

  if (!content) return null

  const isVideo = content.media_path?.endsWith('.mp4')

  return (
    <>
      <div
        onClick={handleClick}
        className="bg-zinc-800 rounded-xl overflow-hidden shadow-md cursor-pointer hover:bg-zinc-700 transition-all"
      >
        {signedUrl ? (
          isVideo ? (
            <div className="w-full h-64 bg-zinc-700 text-white flex items-center justify-center text-sm italic">
              🎥 No preview for this video yet
            </div>
          ) : (
            <SecureImageViewer
              path={content.media_path}
              className={`h-64 w-full transition-all duration-200 ${
                canView ? '' : 'blur-[20px] scale-105'
              }`}
            />

          )
        ) : (
          <div className="w-full h-64 bg-zinc-700 flex items-center justify-center text-white">
            No preview available
          </div>
        )}

        <div className="p-4">
          <p className="text-sm text-white mb-1">
            {content.description || <i>No description</i>}
          </p>

          <p className="text-xs text-zinc-400">
            {content.sub_required
              ? 'Subscription required'
              : content.is_free
              ? 'Free'
              : `${content.price} €`}
          </p>

          {!canView && (
            <p className="mt-2 text-xs text-red-400 font-semibold">
              🔒 Locked content
            </p>
          )}
        </div>
      </div>

      {isOpen && canView && blob && (
        <Modal onClose={handleClose}>
          <SecureContentCard item={content} blob={blob} />
        </Modal>
      )}

      {isOpen && !canView && creator && (
        <LockedContentModal
          item={content}
          creator={creator}
          onClose={handleClose}
          onUnlocked={onUnlocked || (() => {})}
        />
      )}
    </>
  )
}
