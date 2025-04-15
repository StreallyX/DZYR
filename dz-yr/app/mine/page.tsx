'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MinePage() {
  const [purchasedContents, setPurchasedContents] = useState<any[]>([])

  useEffect(() => {
    const fetchPurchases = async () => {
      // Récupération de l'utilisateur connecté
      const session = await supabase.auth.getSession()
      const userId = session.data.session?.user.id
      if (!userId) return

      // Récupération des achats de l'utilisateur
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('content_id')
        .eq('user_id', userId)

      if (!purchases || purchases.length === 0) return

      const contentIds = purchases.map((p) => p.content_id)

      // Récupération des contenus achetés
      const { data: contents } = await supabase
        .from('contents')
        .select('*')
        .in('id', contentIds)

      setPurchasedContents(contents || [])
    }

    fetchPurchases()
  }, [])

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">📁 Mes achats</h1>

      {purchasedContents.length === 0 ? (
        <p className="text-sm text-zinc-400">Tu n’as acheté aucun contenu pour le moment.</p>
      ) : (
        <div className="space-y-6">
          {purchasedContents.map((item) => (
            <div key={item.id} className="bg-zinc-800 p-4 rounded">
              <h2 className="font-semibold text-white mb-2">{item.title}</h2>
              <p className="text-sm text-zinc-300 whitespace-pre-line">{item.description}</p>
              {/* Optionnel : afficher le contenu visuel plus tard */}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
