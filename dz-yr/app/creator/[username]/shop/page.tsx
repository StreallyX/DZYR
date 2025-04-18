'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ContentFeed from '@/components/ContentFeed'

export default function ShopPage() {
  const { username } = useParams()
  const [shopContents, setShopContents] = useState<any[]>([])
  const [viewer, setViewer] = useState<any>(null)

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

      const { data: purchases } = await supabase
        .from('purchases')
        .select('content_id')
        .eq('user_id', currentUser.id)

      const purchased = purchases?.map(p => p.content_id) || []

      setViewer({
        id: currentUser.id,
        purchasedContentIds: purchased,
      })
    }

    load()
  }, [username])

  if (!viewer) return <div>Chargement...</div>

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">🛒 Shop de @{username}</h1>

      <ContentFeed
        contents={shopContents}
        viewer={viewer}
      />
    </div>
  )
}