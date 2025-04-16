'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CreatorProfileHeader from '@/components/CreatorProfileHeader'
import ContentCard from '@/components/ContentCard'
import ContentModal from '@/components/ContentModal'

export default function CreatorProfilePage() {
  const { username } = useParams() as { username: string }
  const [profile, setProfile] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const [blobs, setBlobs] = useState<Record<string, Blob>>({})
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false)
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null)
  const router = useRouter()

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

      if (user) {
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
      }

      const { data: contentData } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })

      setContents(contentData || [])

      const newBlobs: Record<string, Blob> = {}
      for (const item of contentData || []) {
        const canView = item.is_free || (item.sub_required && isSubscribed)
        if (!item.media_path || !canView || !token) continue

        const res = await fetch(`/api/protected-image?path=${item.media_path}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (res.ok) {
          const blob = await res.blob()
          newBlobs[item.id] = blob
        }
      }

      setBlobs(newBlobs)
    }

    if (username) fetchData()
  }, [username])

  const handleWriteClick = async () => {
    const session = await supabase.auth.getSession()
    const user = session.data.session?.user
    if (!user || !profile) return
  
    // Vérifie si une conversation existe déjà entre user et profile
    const { data: convs, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .or(
        `and(user1_id.eq.${user.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${user.id})`
      )
  
    if (convs && convs.length > 0) {
      router.push(`/messages/${convs[0].id}`)
      return
    }
  
    // Sinon, crée la conversation
    const { data: newConv, error: insertError } = await supabase
      .from('conversations')
      .insert([
        {
          user1_id: user.id,
          user2_id: profile.id,
          last_message: '',
          last_message_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()
  
    if (insertError) {
      console.error('Erreur insertion conversation:', insertError.message)
      return
    }
  
    if (newConv) {
      router.push(`/messages/${newConv.id}`)
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

      <div className="space-y-2">
        {contents.map((item) => {
          const canView = item.is_free || (item.sub_required && isSubscribed)
          return (
            <ContentCard
              key={item.id}
              item={item}
              canView={canView}
              onOpen={() => setSelectedItem(item)}
            />
          )
        })}
      </div>

      {selectedItem && (
        <ContentModal
          item={selectedItem}
          blob={blobs[selectedItem.id]}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
