'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'

type Props = {
  item: any
  creator: any
  onClose: () => void
  onUnlocked: () => void // Pour rafraîchir si débloqué
}

export default function LockedContentModal({ item, creator, onClose, onUnlocked }: Props) {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getSession = async () => {
      const session = await supabase.auth.getSession()
      const uid = session.data.session?.user.id
      if (!uid) return onClose()
      setUserId(uid)
    }
    getSession()
  }, [onClose])

  const handleBuy = async () => {
    if (!userId) return
    setLoading(true)

    await supabase
      .from('purchases')
      .insert({ user_id: userId, content_id: item.id })

    setLoading(false)
    onUnlocked()
    onClose()
    alert('✅ Contenu acheté avec succès.')
  }

  const handleSubscribe = async () => {
    if (!userId) return
    setLoading(true)

    const now = new Date()
    const nextMonth = new Date(now.setMonth(now.getMonth() + 1)).toISOString()

    await supabase
      .from('subscriptions')
      .insert({
        subscriber_id: userId,
        creator_id: creator.id,
        end_date: nextMonth,
      })

    setLoading(false)
    onUnlocked()
    onClose()
    alert('✅ Abonnement activé.')
  }

  return (
    <Modal onClose={onClose}>
      <div className="text-white">
        <h2 className="text-lg font-bold mb-2">{item.title}</h2>
        <p className="text-sm text-zinc-400 mb-4">{item.description}</p>

        {item.is_shop_item && (
          <button
            onClick={handleBuy}
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded w-full mb-2"
          >
            {loading ? 'Achat en cours...' : `Acheter pour ${item.price} €`}
          </button>
        )}

        {item.sub_required && !item.is_shop_item && (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded w-full"
          >
            {loading ? 'Abonnement...' : `S’abonner à ${creator.subscription_price} €/mois`}
          </button>
        )}
      </div>
    </Modal>
  )
}
