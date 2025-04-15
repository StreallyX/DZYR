'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])

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

  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  )
}
