'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'

type Props = {
  item: any
  creator: any
  onClose: () => void
  onUnlocked?: () => void
}

export default function LockedContentModal({ item, creator, onClose, onUnlocked }: Props) {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [alreadyPurchased, setAlreadyPurchased] = useState(false)
  const [alreadySubscribed, setAlreadySubscribed] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      const session = await supabase.auth.getSession()
      const uid = session.data.session?.user.id
      if (!uid) return onClose()
      setUserId(uid)

      if (item.is_shop_item) {
        const { data: purchases, error } = await supabase
          .from('purchases')
          .select('id')
          .match({
            user_id: uid,
            content_id: item.id,
          })

        if (error) console.error('Erreur achat check :', error)
        if (purchases && purchases.length > 0) {
          setAlreadyPurchased(true)
        }
      }

      if (item.sub_required) {
        const { data: subs, error: subError } = await supabase
          .from('subscriptions')
          .select('end_date')
          .match({
            creator_id: creator.id,
            subscriber_id: uid,
          })

        if (subError) console.error('Erreur sub check :', subError)

        if (subs && subs.length > 0 && new Date(subs[0].end_date) > new Date()) {
          setAlreadySubscribed(true)
        }
      }
    }

    checkAccess()
  }, [item, creator, onClose])

  const handleBuy = async () => {
    if (!userId || alreadyPurchased) return
    setLoading(true)

    const { error } = await supabase
      .from('purchases')
      .insert({ user_id: userId, content_id: item.id })

    if (error) {
      console.error('Erreur achat :', error)
      setLoading(false)
      return
    }

    setLoading(false)
    onUnlocked?.()
    onClose()
    alert('✅ Contenu acheté avec succès.')
  }

  const handleSubscribe = async () => {
    if (!userId || alreadySubscribed) return
    setLoading(true)

    const now = new Date()
    const nextMonth = new Date(now.setMonth(now.getMonth() + 1)).toISOString()

    const { error } = await supabase
      .from('subscriptions')
      .insert({
        subscriber_id: userId,
        creator_id: creator.id,
        end_date: nextMonth,
      })

    if (error) {
      console.error('Erreur abonnement :', error)
      setLoading(false)
      return
    }

    setLoading(false)
    onUnlocked?.()
    onClose()
    alert('✅ Abonnement activé.')
  }

  return (
    <Modal onClose={onClose}>
      <div className="text-white">
        <h2 className="text-lg font-bold mb-2">{item.title}</h2>
        <p className="text-sm text-zinc-400 mb-4">{item.description}</p>

        {item.is_shop_item && (
          alreadyPurchased ? (
            <p className="bg-green-600 px-3 py-2 rounded text-center text-white font-semibold">
              ✅ Déjà acheté
            </p>
          ) : (
            <button
              onClick={handleBuy}
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded w-full mb-2"
            >
              {loading ? 'Achat en cours...' : `Acheter pour ${item.price} €`}
            </button>
          )
        )}

        {item.sub_required && !item.is_shop_item && (
          alreadySubscribed ? (
            <p className="bg-green-600 px-3 py-2 rounded text-center text-white font-semibold">
              ✅ Abonnement actif
            </p>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded w-full"
            >
              {loading ? 'Abonnement...' : `S’abonner à ${creator.subscription_price ?? '...'} €/mois`}
            </button>
          )
        )}
      </div>
    </Modal>
  )
}
