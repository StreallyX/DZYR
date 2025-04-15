'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import SecureContentCard from '@/components/SecureContentCard'

export default function MinePage() {
  const [purchasedContents, setPurchasedContents] = useState<any[]>([])
  const [blobs, setBlobs] = useState<Record<string, Blob>>({})
  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    const fetchPurchases = async () => {
      const session = await supabase.auth.getSession()
      const userId = session.data.session?.user.id
      const token = session.data.session?.access_token

      if (!userId || !token) return

      const { data: purchases } = await supabase
        .from('purchases')
        .select('content_id')
        .eq('user_id', userId)

      const contentIds = purchases?.map((p) => p.content_id) || []

      const { data: contents } = await supabase
        .from('contents')
        .select('*')
        .in('id', contentIds)

      setPurchasedContents(contents || [])

      // Précharger les blobs
      const newBlobs: Record<string, Blob> = {}
      for (const item of contents || []) {
        if (!item.media_path) continue

        const res = await fetch(`/api/protected-image?path=${item.media_path}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const blob = await res.blob()
          newBlobs[item.id] = blob
        }
      }

      setBlobs(newBlobs)
    }

    fetchPurchases()
  }, [])

  const openImage = (item: any) => {
    setSelectedItem(item)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">📁 Mes contenus achetés</h1>

      {purchasedContents.length === 0 ? (
        <p className="text-sm text-zinc-400">Aucun contenu acheté pour le moment.</p>
      ) : (
        <div className="space-y-6">
          {purchasedContents.map((item) => (
            <div key={item.id} className="bg-zinc-800 p-4 rounded">
              <h2 className="font-semibold text-white mb-2">{item.title}</h2>
              <p className="text-sm text-zinc-300 mb-4 whitespace-pre-line">{item.description}</p>
              {blobs[item.id] ? (
                <button
                  onClick={() => openImage(item)}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded text-sm font-bold"
                >
                  Ouvrir
                </button>
              ) : (
                <p className="text-xs text-zinc-400">Chargement sécurisé...</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal sécurisé */}
      {selectedItem && blobs[selectedItem.id] && (
        <Modal onClose={() => setSelectedItem(null)}>
          <h2 className="text-lg font-bold mb-3">{selectedItem.title}</h2>
          <SecureContentCard item={selectedItem} blob={blobs[selectedItem.id]} />
        </Modal>
      )}
    </div>
  )
}
