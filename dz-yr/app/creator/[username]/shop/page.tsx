'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ContentFeed from '@/components/ContentFeed'

export default function ShopPage() {
  const { username } = useParams()
  const [shopContents, setShopContents] = useState<any[]>([])
  const [viewer, setViewer] = useState<any>(null)

  const refreshViewer = async (uid: string) => {
    const { data: purchases } = await supabase
      .from('purchases')
      .select('content_id')
      .eq('user_id', uid)

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('creator_id, end_date')
      .eq('subscriber_id', uid)

    const now = new Date()
    const validSubs = subscriptions?.filter((sub) => new Date(sub.end_date) > now) || []

    setViewer({
      id: uid,
      purchasedContentIds: purchases?.map((p) => String(p.content_id)) || [],
      subscribedTo: validSubs.map((sub) => sub.creator_id),
    })
  }

  useEffect(() => {
    const load = async () => {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (!user) return

      const { data: contents } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_shop_item', true)

      setShopContents(contents || [])

      const session = await supabase.auth.getSession()
      const currentUser = session.data.session?.user
      if (!currentUser) return

      await refreshViewer(currentUser.id)
    }

    if (username) load()
  }, [username])

  if (!viewer) return <div>Chargement...</div>

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">🛒 Shop de @{username}</h1>

      <ContentFeed
        contents={shopContents}
        viewer={viewer}
        onRefresh={() => refreshViewer(viewer.id)}
      />
    </div>
  )
}
