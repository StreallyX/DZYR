'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/contexts/AuthContext'
import ProfileHeader from '@/components/ProfileHeader'
import ProfileActions from '@/components/ProfileActions'
import ContentFeed from '@/components/ContentFeed'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const [subscribedTo, setSubscribedTo] = useState<string[]>([])
  const [purchasedIds, setPurchasedIds] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
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

      const { data: subs } = await supabase
        .from('subscriptions')
        .select('creator_id')
        .eq('user_id', user.id)
        .gte('end_date', new Date().toISOString())

      setSubscribedTo((subs || []).map((s) => s.creator_id))

      const { data: purchases } = await supabase
        .from('purchases')
        .select('content_id')
        .eq('user_id', user.id)

      setPurchasedIds((purchases || []).map((p) => p.content_id))
    }

    fetchData()
  }, [user])

  if (!user || !profile) return null

  return (
    <div className="pt-4">
      <ProfileHeader profile={profile} isOwnProfile={true} />
      <ProfileActions showShopButton={true} />
      <ContentFeed
        contents={contents}
        viewer={{
          id: user.id,
          subscribedTo,
          purchasedContentIds: purchasedIds,
        }}
      />
    </div>
  )
}
