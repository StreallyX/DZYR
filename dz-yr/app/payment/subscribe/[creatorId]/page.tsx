'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SubscribePage() {
  const { creatorId } = useParams()
  const router = useRouter()

  const [creator, setCreator] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCreator = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('username, subscription_price')
        .eq('id', creatorId) // 👈 correct now
        .single()

      if (error) {
        console.error('Erreur chargement créateur :', error)
        setLoading(false)
        return
      }

      setCreator(data)
      setLoading(false)
    }

    fetchCreator()
  }, [creatorId])

  const handleConfirm = async () => {
    const session = await supabase.auth.getSession()
    const userId = session.data.session?.user.id
    const userEmail = session.data.session?.user.email

    if (!userId) return alert('Non connecté')

    // Vérifie si l'utilisateur existe dans la table "users"
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    // Si l'utilisateur n'existe pas → l'ajouter automatiquement
    if (!existingUser) {
      const { error: insertError } = await supabase.from('users').insert({
        id: userId,
        username: userEmail?.split('@')[0] || 'anonymous',
      })

      if (insertError) {
        console.error("Erreur lors de la création automatique de l'utilisateur :", insertError)
        return alert("Impossible de créer l'utilisateur dans la base.")
      }
    }

    // Insère dans subscriptions (paiement simulé)
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    const { error } = await supabase.from('subscriptions').insert({
      subscriber_id: userId,
      creator_id: creatorId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: true,
    })

    if (error) {
      console.error('Erreur abonnement :', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
      })
      return alert("Erreur lors de l'abonnement.")
    }

    alert('Abonnement réussi ✅')
    router.push(`/creator/${creator?.username}`)
  }

  if (loading) return <div className="p-4 text-center">Chargement...</div>
  if (!creator) return <div className="p-4 text-center text-red-500">Créateur introuvable.</div>

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Confirmation d’abonnement</h1>

      <div className="bg-zinc-800 text-white p-6 rounded shadow mb-6">
        <p className="text-lg mb-2">
          Vous allez vous abonner à <strong>@{creator.username}</strong>.
        </p>
        <p className="mb-4">Montant : <strong>{creator.subscription_price}$ / mois</strong></p>
        <p className="text-sm text-zinc-400">
          Le prochain paiement sera dû dans 30 jours. Vous pouvez annuler à tout moment.
        </p>
      </div>

      <button
        onClick={handleConfirm}
        className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3 rounded w-full"
      >
        ✅ Confirmer l’abonnement
      </button>
    </div>
  )
}
