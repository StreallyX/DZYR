'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ContentFeed from '@/components/ContentFeed'

export default function ShopPage() {
  const { username } = useParams()
  const [shopContents, setShopContents] = useState<any[]>([])
  const [purchasedIds, setPurchasedIds] = useState<string[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [blobs, setBlobs] = useState<Record<string, Blob>>({})
  const [creator, setCreator] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (!user) return
      setCreator(user)

      const { data: contents } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_shop_item', true)

      setShopContents(contents || [])

      const session = await supabase.auth.getSession()
      const userId = session.data.session?.user.id
      const token = session.data.session?.access_token
      if (!userId || !token) return

      const { data: purchases } = await supabase
        .from('purchases')
        .select('content_id')
        .eq('user_id', userId)

      const purchased = purchases?.map(p => p.content_id) || []
      setPurchasedIds(purchased)

      const signed: Record<string, string> = {}
      const blobMap: Record<string, Blob> = {}

      for (const item of contents || []) {
        if (!item.media_path) continue

        const { data: signedUrlData } = await supabase.storage
          .from('contents')
          .createSignedUrl(item.media_path, 60)

        if (signedUrlData?.signedUrl) {
          signed[item.id] = signedUrlData.signedUrl
        }

        if (purchased.includes(item.id)) {
          const res = await fetch(`/api/protected-image?path=${item.media_path}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (res.ok) {
            blobMap[item.id] = await res.blob()
          }
        }
      }

      setSignedUrls(signed)
      setBlobs(blobMap)
    }

    load()
  }, [username])

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">🛒 Shop de @{username}</h1>

      <ContentFeed
        contents={shopContents}
        signedUrls={signedUrls}
        blobMap={blobs}
        isOwnProfile={false}
        isSubscribed={false}
        purchasedIds={purchasedIds}
        creator={creator}
      />
    </div>
  )
}
