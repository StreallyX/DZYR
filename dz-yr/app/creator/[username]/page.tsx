'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

      // Check abonnement
      if (user) {
        const { data: subs, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('creator_id', profileData.id)
          .eq('subscriber_id', user.id)

        const now = new Date()
        const hasValidSubscription = (subs || []).some(sub => {
          return sub.end_date && new Date(sub.end_date) > now
        })

        if (hasValidSubscription) {
          setIsSubscribed(true)
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

  if (!profile) return <div>Chargement du créateur...</div>

  return (
    <div className="p-4">
      <CreatorProfileHeader
        profile={profile}
        isSubscribed={isSubscribed}
        onSubscribe={() => console.log('TODO: Gérer abonnement')}
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
