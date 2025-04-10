'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchProfileAndContents = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('Utilisateur non connecté')
        router.push('/auth/login')
        return
      }

      console.log('Utilisateur connecté :', user)

      let { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)

      console.log('Profil récupéré (avant insertion) :', profileData)

      if (!profileData || profileData.length === 0) {
        console.warn('Aucun profil trouvé, création...')

        const { error: insertError } = await supabase.from('users').insert([
          {
            user_id: user.id,
            bio: '',
            subscription_price: 0,
            avatar_url: '',
            created_at: new Date().toISOString(),
          },
        ])

        if (insertError) {
          console.error('Erreur lors de la création du profil :', insertError.message || insertError)
          return
        }

        const { data: newProfiles, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)

        console.log('Résultat fetch après insert :', newProfiles)

        if (fetchError || !newProfiles || newProfiles.length === 0) {
          console.error('Erreur après création :', fetchError || 'Profil introuvable')
          return
        }

        profileData = newProfiles
      }

      setProfile(profileData[0])

      const { data: contentData, error: contentError } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (contentError) {
        console.error('Erreur lors de la récupération des contenus :', contentError.message)
      }

      console.log('Contenus récupérés :', contentData)

      setContents(contentData || [])
    }

    fetchProfileAndContents()
  }, [router])

  return (
    <ProtectedRoute>
      <div className="pt-4">
        <div className="flex justify-between items-center px-4">
          <div className="text-sm">
            <div className="text-xl font-bold">0 abonnés</div>
            <div className="text-zinc-400">0 abonnements</div>
          </div>
          <div>
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="avatar"
                width={64}
                height={64}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-zinc-700 rounded-full" />
            )}
          </div>
        </div>

        <div className="px-4 mt-4">
          <p className="text-sm text-zinc-300 italic">
            {profile?.bio ?? 'Aucune bio'}
          </p>
          {profile?.subscription_price && (
            <p className="text-sm text-violet-400 mt-1">
              Abonnement : {profile.subscription_price.toFixed(2)} € / mois
            </p>
          )}
          <button
            onClick={() => router.push('/profile/upload')}
            className="mt-4 bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded text-sm"
          >
            Ajouter un contenu
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 mt-4 px-1">
          {contents.map((item) => (
            <div
              key={item.id}
              className="relative w-full aspect-square overflow-hidden bg-zinc-800"
            >
              <img
                src={item.media_url}
                alt="content"
                className="w-full h-full object-cover filter blur-sm"
              />
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-xs text-white px-1 rounded">
                {item.sub_required
                  ? 'Abonnement'
                  : item.is_free
                  ? 'Gratuit'
                  : `${item.price} €`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  )
}
