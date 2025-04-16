'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

import ContentFeed from '@/components/ContentFeed'

export default function MinePage() {
  const [purchasedContents, setPurchasedContents] = useState<any[]>([])
  const [purchasedIds, setPurchasedIds] = useState<string[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [blobs, setBlobs] = useState<Record<string, Blob>>({})

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
      setPurchasedIds(contentIds)

      const { data: contents } = await supabase
        .from('contents')
        .select('*')
        .in('id', contentIds)

      setPurchasedContents(contents || [])

      const signed: Record<string, string> = {}
      const blobsMap: Record<string, Blob> = {}

      for (const item of contents || []) {
        if (!item.media_path) continue

        const { data: signedUrlData } = await supabase.storage
          .from('contents')
          .createSignedUrl(item.media_path, 60)

        if (signedUrlData?.signedUrl) {
          signed[item.id] = signedUrlData.signedUrl
        }

        const res = await fetch(`/api/protected-image?path=${item.media_path}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          blobsMap[item.id] = await res.blob()
        }
      }

      setSignedUrls(signed)
      setBlobs(blobsMap)
    }

    fetchPurchases()
  }, [])

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">📁 Mes contenus achetés</h1>

      <ContentFeed
        contents={purchasedContents}
        signedUrls={signedUrls}
        blobMap={blobs}
        isOwnProfile={false}
        isSubscribed={false}
        purchasedIds={purchasedIds}
        creator={null}
      />
    </div>
  )
}
