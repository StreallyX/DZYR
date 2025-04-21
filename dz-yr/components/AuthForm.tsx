'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false) // ✅ nouveau champ
  const router = useRouter()

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
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Identifiants invalides ou email non confirmé.')
      } else {
        router.push('/profile')
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { username },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('Password should be')) {
          setError('Mot de passe trop faible (min. 6 caractères).')
        } else {
          setError(signUpError.message)
        }
        return
      }

      const { data: userData, error: sessionError } = await supabase.auth.getUser()

      if (sessionError || !userData?.user) {
        setError("Erreur : impossible de récupérer l'utilisateur.")
        return
      }

      const userId = userData.user.id

      const { error: insertError } = await supabase.from('users').insert([{
        id: userId,
        username,
        bio: '',
        subscription_price: 0,
        avatar_url: '',
      }])

      if (insertError) {
        setError("Erreur lors de la création du profil : " + insertError.message)
        return
      }

      alert('📨 Vérifie ta boîte mail pour confirmer ton compte.')
      setIsLogin(true)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 pt-24">
      <h2 className="text-xl font-bold mb-4 text-white">{isLogin ? 'Connexion' : 'Inscription'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <input
              className="border p-2 w-full text-white bg-zinc-900 placeholder-zinc-400"
              type="text"
              placeholder="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </>
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
            J’accepte les <a href="/terms" target="_blank" className="underline ml-1">conditions d’utilisation</a>.
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
