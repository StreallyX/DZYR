'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'


export default function ShopPage() {
  const { username } = useParams()
  const [shopContents, setShopContents] = useState<any[]>([])
  const [myPurchases, setMyPurchases] = useState<string[]>([])
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      // 1. Récupère le créateur
      const { data: user } = await supabase
        .from('users')
        .select('user_id')
        .eq('username', username)
        .single()

      if (!user) return

      // 2. Récupère tous les contenus shop
      const { data: contents } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', user.user_id)
        .eq('is_shop_item', true)

      setShopContents(contents || [])

      // 3. Vérifie les achats du user connecté
      const session = await supabase.auth.getSession()
      const userId = session.data.session?.user.id

      if (!userId) return

      const { data: purchases } = await supabase
        .from('purchases')
        .select('content_id')
        .eq('user_id', userId)

      setMyPurchases(purchases?.map((p) => p.content_id) || [])
    }

    load()
  }, [username])

  const alreadyBought = (id: string) => myPurchases.includes(id)

  const handleBuy = async (contentId: string) => {
    const session = await supabase.auth.getSession()
    const userId = session.data.session?.user.id
    if (!userId) return alert('Non connecté')
  
    // 🚧 SIMULATION ACTUELLE
    // 👉 Ceci est à remplacer plus tard par une redirection Vendo
    await supabase.from('purchases').insert({ user_id: userId, content_id: contentId })
  
    // ✅ Tu feras ceci seulement APRÈS validation réelle du paiement Vendo
    setMyPurchases((prev) => [...prev, contentId])
    setSelected(null)
    alert('Achat effectué ✅')
  
    // 🔁 PLUS TARD (Vendo) :
    // - Tu rediriges ici vers l’URL de checkout Vendo
    //   par ex: window.location.href = `https://vendo-services.com/pay?user=${userId}&content=${contentId}`
    // - Tu crées un Webhook ou une page `/payment/success?content_id=XXX`
    // - Sur cette page, tu insères dans Supabase si le paiement est OK
  }
  

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Contenus à acheter de @{username}</h1>

      <div className="space-y-6">
        {shopContents.map((item) => (
          <div key={item.id} className="bg-zinc-800 rounded p-4">
            <h2 className="font-semibold mb-1">{item.title}</h2>
            <p className="text-sm text-zinc-300 mb-4 whitespace-pre-line">{item.description}</p>
            {alreadyBought(item.id) ? (
              <div className="bg-green-700 text-white px-3 py-1 rounded text-center">
                ✅ Already Bought
              </div>
            ) : (
              <button
                onClick={() => setSelected(item)}
                className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded w-full font-bold"
              >
                Acheter {item.price}$
              </button>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <h2 className="text-lg font-bold mb-2">{selected.title}</h2>
          <p className="text-sm text-zinc-300 mb-4">{selected.description}</p>
          <button
            onClick={() => handleBuy(selected.id)}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded w-full"
          >
            Payer {selected.price}$
          </button>
        </Modal>
      )}
    </div>
  )
}
