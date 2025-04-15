'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)
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
      } await supabase.auth.getUser()

      console.log("USER.ID =", user.id)

      const { data: rawUsers } = await supabase.from('users').select('*')
      console.log("TOUS LES UTILISATEURS:", rawUsers)


  
      if (authError || !user) {
        console.error('Utilisateur non connecté')
        router.push('/auth/login')
        return
      }
  
      setUserId(user.id)
  
      // 🛠️ Ne tente jamais de créer un profil ici
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .limit(1)
  
      if (profileError || !profileData || profileData.length === 0) {
        console.error('Erreur récupération profil (ou profil introuvable) :', profileError)
        return
      }
  
      setProfile(profileData[0])
      setUsername(profileData[0].username || '')
  
      const { data: contentData, error: contentError } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
  
      if (contentError) {
        console.error('Erreur contenus :', contentError)
      }
  
      setContents(contentData || [])
  
      const signed: Record<string, string> = {}
      for (const item of contentData || []) {
        if (!item.media_path) continue
        const { data: signedUrlData } = await supabase.storage
          .from('contents')
          .createSignedUrl(item.media_path, 60)
        if (signedUrlData?.signedUrl) {
          signed[item.id] = signedUrlData.signedUrl
        }
      }
      setSignedUrls(signed)
    }
  
    fetchProfileAndContents()
  }, [router])
  

  const isOwnProfile = profile?.id === userId

  return (
    <ProtectedRoute>
      <div className="pt-4">
        <div className="flex justify-between items-center px-4">
          <div className="text-sm">
            <div className="text-xl font-bold">@{username || 'Profil'}</div>
            <div className="text-zinc-400">0 abonnés · 0 abonnements</div>
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
              onClick={() => setSelectedItem(item)}
              className="relative w-full aspect-square overflow-hidden bg-zinc-800 cursor-pointer"
            >
              {signedUrls[item.id] && (
                <img
                  src={signedUrls[item.id]}
                  alt="content"
                  className={`w-full h-full object-cover transition-all duration-200 ${
                    !isOwnProfile && !item.is_free ? 'blur-[8px] scale-105' : ''
                  }`}
                  draggable={false}
                />
              )}
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-xs text-white px-1 rounded">
                {item.sub_required ? 'Abonnement' : item.is_free ? 'Gratuit' : `${item.price} €`}
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-zinc-900 p-4 rounded shadow-lg w-full max-w-md relative">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-2 right-2 text-white text-xl"
              >
                ×
              </button>
              {signedUrls[selectedItem.id] && (
                <img
                  src={signedUrls[selectedItem.id]}
                  alt="media"
                  className="w-full h-auto rounded mb-4"
                />
              )}
              <p className="text-sm text-white mb-2">{selectedItem.description}</p>
              <p className="text-xs text-gray-400 mb-2">
                {selectedItem.sub_required
                  ? 'Abonnement requis'
                  : selectedItem.is_free
                  ? 'Gratuit'
                  : `${selectedItem.price} €`}
              </p>
              {isOwnProfile && (
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/profile/edit/${selectedItem.id}`)}
                    className="bg-blue-600 text-white px-4 py-1 rounded text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-1 rounded text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}