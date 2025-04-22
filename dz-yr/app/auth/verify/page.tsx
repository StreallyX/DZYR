'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token manquant.')
      return
    }

    const verifyEmail = async () => {
      const res = await fetch(`/api/auth/verify?token=${token}`)
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message || 'Adresse email confirmée ✅')
      } else {
        setStatus('error')
        setMessage(data.error || 'Erreur de vérification.')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="max-w-md mx-auto pt-32 text-center text-white">
      {status === 'pending' && <p>Vérification en cours...</p>}
      {status === 'success' && (
        <>
          <h2 className="text-2xl font-bold mb-4">✔️ Vérification réussie</h2>
          <p>{message}</p>
        </>
      )}
      {status === 'error' && (
        <>
          <h2 className="text-2xl font-bold mb-4">❌ Erreur</h2>
          <p>{message}</p>
        </>
      )}
    </div>
  )
}
