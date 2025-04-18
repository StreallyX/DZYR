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
  const [viewer, setViewer] = useState<any>(null)

  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Utilisateur non connecté')
        router.push('/auth/login')
        return
      }

      setViewer(user)

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
    }

    fetchData()
  }, [router])

  const isOwnProfile = profile?.id === viewer?.id

  return (
    <ProtectedRoute>
      <div className="pt-4">
        {profile && viewer && (
          <>
            <ProfileHeader
              profile={profile}
              isOwnProfile={isOwnProfile}
            />

            <ProfileActions showShopButton={true} />

            <ContentFeed
              contents={contents}
              viewer={{
                id: viewer.id,
                subscribedTo: viewer.subscribedTo || [],
                purchasedContentIds: viewer.purchasedContentIds || [],
              }}
            />
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}