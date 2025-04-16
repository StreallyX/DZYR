'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import ProtectedRoute from '@/components/ProtectedRoute'
import ProfileHeader from '@/components/ProfileHeader'
import ProfileActions from '@/components/ProfileActions'
import ContentFeed from '@/components/ContentFeed'
import SecureContentCard from '@/components/SecureContentCard'
import { Modal } from '@/components/ui/Modal'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [blobs, setBlobs] = useState<Record<string, Blob>>({})
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
        .single()

      if (profileError || !profileData) {
        console.error('Erreur récupération profil :', profileError)
        return
      }

      setProfile(profileData)

      const { data: contentData, error: contentError } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (contentError) {
        console.error('Erreur contenus :', contentError)
        return
      }

      setContents(contentData || [])

      const token = (await supabase.auth.getSession()).data.session?.access_token

      const signed: Record<string, string> = {}
      const blobsMap: Record<string, Blob> = {}

      for (const item of contentData || []) {
        if (!item.media_path || !token) continue

        // Génère l’URL signée
        const { data: signedUrlData } = await supabase.storage
          .from('contents')
          .createSignedUrl(item.media_path, 60)

        if (signedUrlData?.signedUrl) {
          signed[item.id] = signedUrlData.signedUrl
        }

        // Charge le blob pour affichage sécurisé
        const res = await fetch(`/api/protected-image?path=${item.media_path}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          blobsMap[item.id] = await res.blob()
        }
      }

      setSignedUrls(signed)
      setBlobs(blobsMap)
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
              blobMap={blobs}
              isOwnProfile={true}
              creator={profile}
            />

          </>
        )}

        {/* Modal sécurisé */}
        {selectedItem && blobs[selectedItem.id] && (
          <Modal onClose={() => setSelectedItem(null)}>
            <SecureContentCard item={selectedItem} blob={blobs[selectedItem.id]} />
          </Modal>
        )}
      </div>
    </ProtectedRoute>
  )
}
