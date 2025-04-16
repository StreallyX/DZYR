'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import CreatorProfileHeader from '@/components/CreatorProfileHeader'
import ContentFeed from '@/components/ContentFeed'

export default function CreatorProfilePage() {
  const { username } = useParams() as { username: string }
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [blobs, setBlobs] = useState<Record<string, Blob>>({})
  const [purchasedIds, setPurchasedIds] = useState<string[]>([])
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')

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
      const token = session.data.session?.access_token

      if (!user || !token) return
      setUserId(user.id)

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

      setPurchasedIds(purchases?.map(p => p.content_id) || [])

      const { data: contentData } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })

      setContents(contentData || [])

      const signed: Record<string, string> = {}
      const blobMap: Record<string, Blob> = {}

      for (const item of contentData || []) {
        const canView =
          item.is_free ||
          (item.sub_required && validSub) ||
          (purchases?.some(p => p.content_id === item.id))

        if (!item.media_path) continue

        const { data: signedUrlData } = await supabase.storage
          .from('contents')
          .createSignedUrl(item.media_path, 60)

        if (signedUrlData?.signedUrl) {
          signed[item.id] = signedUrlData.signedUrl
        }

        if (canView) {
          const res = await fetch(`/api/protected-image?path=${item.media_path}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (res.ok) {
            blobMap[item.id] = await res.blob()
          }
        }
      }

      setSignedUrls(signed)
      setBlobs(blobMap)
    }

    if (username) fetchData()
  }, [username])

  const handleWriteClick = async () => {
    if (!userId || !profile) return

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(
        `and(user1_id.eq.${userId},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${userId})`
      )

    if (convs && convs.length > 0) {
      router.push(`/messages/${convs[0].id}`)
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert([
          {
            user1_id: userId,
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

  if (!profile) return <div>Chargement du créateur...</div>

  return (
    <div className="p-4">
      <CreatorProfileHeader
        profile={profile}
        isSubscribed={isSubscribed}
        subscriptionEndDate={subscriptionEndDate ?? undefined}
        onWriteClick={handleWriteClick}
      />

      <ContentFeed
        contents={contents}
        signedUrls={signedUrls}
        blobMap={blobs}
        isOwnProfile={false}
        purchasedIds={purchasedIds}
        isSubscribed={isSubscribed}
        creator={profile}
      />
    </div>
  )
}
