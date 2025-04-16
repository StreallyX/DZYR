'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import ProtectedRoute from '@/components/ProtectedRoute'
import ProfileHeader from '@/components/ProfileHeader'
import ProfileActions from '@/components/ProfileActions'
import ContentFeed from '@/components/ContentFeed'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState('')
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Utilisateur non connecté')
        router.push('/auth/login')
        return
      }

      setUserId(user.id)

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .limit(1)

      if (profileError || !profileData || profileData.length === 0) {
        console.error('Erreur récupération profil :', profileError)
        return
      }

      const profile = profileData[0]
      setProfile(profile)
      setUsername(profile.username || '')

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

    fetchData()
  }, [router])

  const isOwnProfile = profile?.id === userId

  return (
    <ProtectedRoute>
      <div className="pt-4">
        {profile && (
          <>
            <ProfileHeader
              profile={profile}
              isOwnProfile={isOwnProfile}
              onEditProfile={() => router.push('/settings/account')}
            />

            <ProfileActions showShopButton={true} />

            <ContentFeed
              contents={contents}
              signedUrls={signedUrls}
              isOwnProfile={isOwnProfile}
              onSelect={(item) => setSelectedItem(item)}
            />
          </>
        )}

        {/* Modal d’aperçu du contenu */}
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
                  <button className="bg-red-600 text-white px-4 py-1 rounded text-sm">
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
