'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        window.location.href = '/auth/login'
        return
      }

      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        window.location.href = '/auth/login'
        return
      }

      const { user } = await res.json()
      setUserId(user.id)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) return setResults([])

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', `%${query}%`)

      console.log('Query:', query)
      console.log('Résultats de recherche :', data, error)
      setResults(data || [])
    }

    const timer = setTimeout(() => search(), 300)
    return () => clearTimeout(timer)
  }, [query])

  if (!userId) return <div className="p-4 text-white">Chargement...</div>

  return (
    <div className="pt-4 px-4">
      <input
        type="text"
        placeholder="Rechercher un créateur..."
        className="w-full border border-zinc-700 bg-zinc-900 text-white p-2 rounded mb-4"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div>
        {results.map((user) => (
          <Link key={user.id} href={`/creator/${user.username}`}>
            <div className="bg-zinc-800 text-white p-4 rounded shadow mb-2 hover:shadow-md">
              @{user.username}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
