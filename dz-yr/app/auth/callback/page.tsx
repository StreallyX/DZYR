'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const ensureProfileCreated = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.warn('Utilisateur non connecté')
        return
      }

      const { data: profileExists, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .limit(1)

      if (error) {
        console.error('Erreur lors de la vérification du profil :', error.message)
        return
      }

      if (!profileExists || profileExists.length === 0) {
        const username = user.user_metadata?.username || `user_${Math.floor(Math.random() * 9999)}`
        const { error: insertError } = await supabase.from('users').insert([
          {
            id: user.id,
            username,
            bio: '',
            subscription_price: 0,
            avatar_url: '',
          },
        ])

        if (insertError) {
          console.error('Erreur lors de la création du profil :', insertError.message)
          return
        }

        console.log('✅ Profil créé dans `users`')
      }

      // redirige vers /profile après tout
      router.push('/profile')
    }

    ensureProfileCreated()
  }, [router])

  return (
    <div className="text-white p-6">
      <p>Connexion en cours...</p>
    </div>
  )
}
