'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import SecureImageViewer from '@/components/SecureImageViewer'

export default function CreatorProfilePage() {
  const { username } = useParams() as { username: string }
  const [profile, setProfile] = useState<any>(null)
  const [contents, setContents] = useState<any[]>([])
  const [blobs, setBlobs] = useState<Record<string, Blob>>({})
  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (!profileData) return
      setProfile(profileData)

      const { data: contentData } = await supabase
        .from('contents')
        .select('*')
        .eq('user_id', profileData.user_id)
        .order('created_at', { ascending: false })

      setContents(contentData || [])

      const newBlobs: Record<string, Blob> = {}
      for (const item of contentData || []) {
        if (!item.media_path || item.is_free) continue

        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token
        if (!token) continue

        const res = await fetch(`/api/protected-image?path=${item.media_path}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold">@{profile.username}</h1>
          <p className="text-gray-400 text-sm italic">{profile.bio ?? 'Aucune bio.'}</p>
          {profile.subscription_price > 0 && (
            <p className="text-violet-400 text-sm mt-1">
              Abonnement : {profile.subscription_price.toFixed(2)} € / mois
            </p>
          )}
        </div>
        {profile.avatar_url ? (
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

      <div className="grid grid-cols-3 gap-1">
        {contents.map((item) => (
          <div
            key={item.id}
            className="relative w-full aspect-square overflow-hidden bg-zinc-800 cursor-pointer"
            onClick={() => setSelectedItem(item)}
          >
            {item.is_free ? (
              <img
                src={item.media_url}
                alt="content"
                className="w-full h-full object-cover"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : blobs[item.id] ? (
              <div className="w-full h-full relative">
                <div className="absolute inset-0 blur-2xl scale-110 z-10 bg-black/30" />
                <SecureImageViewer
                  blob={blobs[item.id]}
                  width={300}
                  height={300}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-zinc-700 animate-pulse" />
            )}
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-xs text-white px-1 rounded">
              {item.is_free ? 'Gratuit' : item.sub_required ? 'Abonnement' : `${item.price} €`}
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-4 rounded shadow-lg w-full max-w-md relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-2 right-2 text-white text-xl"
            >
              &times;
            </button>
            {selectedItem.is_free ? (
              <img
                src={selectedItem.media_url}
                alt="modal"
                className="w-full h-auto rounded"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : blobs[selectedItem.id] ? (
              <SecureImageViewer
                blob={blobs[selectedItem.id]}
                width={400}
                height={400}
                className="w-full h-auto"
              />
            ) : (
              <div className="w-full h-80 bg-zinc-800 animate-pulse rounded" />
            )}
            <p className="text-sm text-white mt-2 italic">{selectedItem.description}</p>
          </div>
        </div>
      )}
    </div>
  )
}