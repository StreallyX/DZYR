'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ContentFeed from '@/components/ContentFeed'

export default function MinePage() {
  const [viewer, setViewer] = useState<any>(null)
  const [purchasedContents, setPurchasedContents] = useState<any[]>([])

  useEffect(() => {
    const fetchPurchases = async () => {
      const session = await supabase.auth.getSession()
      const user = session.data.session?.user
      if (!user) return
      setViewer(user)

      const { data: purchases } = await supabase
        .from('purchases')
        .select('content_id')
        .eq('user_id', user.id)

      const contentIds = purchases?.map((p) => p.content_id) || []

      const { data: contents } = await supabase
        .from('contents')
        .select('*')
        .in('id', contentIds)

      setPurchasedContents(contents || [])
    }

    fetchPurchases()
  }, [])

  if (!viewer) return <div className="p-4">Chargement...</div>

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">📁 Mes contenus achetés</h1>
      <ContentFeed contents={purchasedContents} viewer={{
        id: viewer.id,
        purchasedContentIds: purchasedContents.map(c => c.id)
      }} />
    </div>
  )
}