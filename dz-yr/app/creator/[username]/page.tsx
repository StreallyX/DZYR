'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import ProfileHeader from '@/components/ProfileHeader'
import ContentFeed from '@/components/ContentFeed'
import CreatorProfileActions from '@/components/CreatorProfileActions'

export default function CreatorProfilePage() {
  const { username } = useParams() as { username: string }
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const [viewer, setViewer] = useState<any>(null)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (!profileData) return
      setProfile(profileData)

      const session = await supabase.auth.getSession()
      const user = session.data.session?.user
      if (!user) return

      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('creator_id', profileData.id)
        .eq('subscriber_id', user.id)

      const now = new Date()
      const validSub = (subs || []).find(
        (sub) => sub.end_date && new Date(sub.end_date) > now
      )

      if (validSub) {
        setIsSubscribed(true)
        setSubscriptionEndDate(validSub.end_date)
      }

      const { data: purchases } = await supabase
        .from('purchases')
        .select('content_id')
        .eq('user_id', user.id)

      const { data: contentData } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })

      setContents(contentData || [])

      setViewer({
        id: user.id,
        subscribedTo: validSub ? [profileData.id] : [],
        purchasedContentIds: purchases?.map(p => p.content_id) || []
      })
    }

    if (username) fetchData()
  }, [username])

  const handleSubscribeClick = () => {
    if (!profile?.id) return
    router.push(`/payment/subscribe/${profile.id}`)
  }

  const handleWriteClick = async () => {
    if (!viewer?.id || !profile) return

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(
        `and(user1_id.eq.${viewer.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${viewer.id})`
      )

    if (convs && convs.length > 0) {
      router.push(`/messages/${convs[0].id}`)
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert([
          {
            user1_id: viewer.id,
            user2_id: profile.id,
            last_message: '',
            last_message_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (newConv) {
        router.push(`/messages/${newConv.id}`)
      }
    }
  }

  if (!profile || viewer === null) return <div>Chargement du créateur...</div>

  return (
    <div className="p-4">
      <ProfileHeader
        profile={profile}
        isOwnProfile={false}
      />

      <CreatorProfileActions
        profile={profile}
        isSubscribed={isSubscribed}
        subscriptionEndDate={subscriptionEndDate ?? undefined}
        onWriteClick={handleWriteClick}
        onSubscribe={handleSubscribeClick}
      />

      <ContentFeed
        contents={contents}
        viewer={viewer}
      />
    </div>
  )
}