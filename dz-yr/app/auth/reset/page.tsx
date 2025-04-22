'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')

    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    const data = await res.json()

    if (res.ok) {
      setStatus('success')
      setMessage('Mot de passe mis à jour. Tu peux te connecter.')
      setTimeout(() => router.push('/auth/login'), 2000)
    } else {
      setStatus('error')
      setMessage(data.error || 'Erreur')
    }
  }

  if (!token) {
    return <div className="text-white text-center pt-32">❌ Token manquant</div>
  }

  return (
    <div className="max-w-md mx-auto pt-32 text-center text-white">
      <h2 className="text-2xl font-bold mb-4">🔒 Réinitialisation du mot de passe</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-zinc-900 text-white"
        />
        <button
          type="submit"
          className="w-full bg-violet-600 hover:bg-violet-500 p-2 rounded text-white"
          disabled={status === 'submitting'}
        >
          Réinitialiser
        </button>
      </form>

      {message && (
        <p className={`mt-4 ${status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
