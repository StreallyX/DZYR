'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const router = useRouter()
  const { setUser } = useAuth() // ✅ pour mise à jour immédiate du contexte

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password || (!isLogin && !username)) {
      setError('Tous les champs sont requis.')
      return
    }

    if (!isLogin && !acceptTerms) {
      setError('Tu dois accepter les conditions générales.')
      return
    }

    if (isLogin) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la connexion.')
      } else {
        localStorage.setItem('auth-token', data.token) // ✅ stocke le token
        setUser(data.user) // ✅ met à jour le contexte immédiatement
        router.push('/profile')
      }
    } else {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l’inscription.')
      } else {
        alert('📨 Vérifie tes e-mails pour confirmer ton compte.')
        setIsLogin(true)
      }
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 pt-24">
      <h2 className="text-xl font-bold mb-4 text-white">
        {isLogin ? 'Connexion' : 'Inscription'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <input
            className="border p-2 w-full text-white bg-zinc-900 placeholder-zinc-400"
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}
        <input
          className="border p-2 w-full text-white bg-zinc-900 placeholder-zinc-400"
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2 w-full text-white bg-zinc-900 placeholder-zinc-400"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {!isLogin && (
          <label className="flex items-center text-sm text-white">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mr-2"
            />
            J’accepte les{' '}
            <a href="/terms" target="_blank" className="underline ml-1">
              conditions d’utilisation
            </a>
            .
          </label>
        )}

        <button
          className="bg-violet-600 hover:bg-violet-500 text-white p-2 w-full rounded"
          type="submit"
        >
          {isLogin ? 'Se connecter' : 'Créer un compte'}
        </button>

        <p
          onClick={() => {
            setIsLogin(!isLogin)
            setError('')
          }}
          className="text-blue-400 cursor-pointer text-sm underline text-center"
        >
          {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà inscrit ? Se connecter'}
        </p>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </form>
    </div>
  )
}
