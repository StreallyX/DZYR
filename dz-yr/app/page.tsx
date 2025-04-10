'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type UserProfile = {
  id: string
  username: string
  bio?: string
  avatar_url?: string
}

export default function HomePage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([])

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (!error && data) {
        setProfiles(data)
      }
    }

    fetchProfiles()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Découvre les créateurs DZYR 🔥</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {profiles.map((profile) => (
          <Link key={profile.id} href={`/creator/${profile.username}`}>
            <div className="p-4 border rounded hover:shadow cursor-pointer">
              <div className="font-bold">{profile.username}</div>
              <div className="text-sm text-gray-500">
                {profile.bio ?? 'Ce créateur n’a pas encore écrit de bio.'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
