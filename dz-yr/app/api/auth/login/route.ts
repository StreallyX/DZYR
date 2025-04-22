import { supabase } from '@/lib/supabase'
import { createSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email ou mot de passe manquant' }, { status: 400 })
  }

  // 1. Récupération du user
  const { data: user } = await supabase
    .from('users')
    .select('id, password_hash, is_verified, username')
    .eq('email', email)
    .single()

  if (!user || !user.is_verified) {
    return NextResponse.json({ error: 'Identifiants invalides ou compte non vérifié' }, { status: 400 })
  }

  // 2. Vérif mot de passe
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 400 })
  }

  // 3. Supprimer anciens tokens
  const { error: deleteError } = await supabase
    .from('tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('type', 'login')

  if (deleteError) {
    console.error('[LOGIN] Erreur suppression anciens tokens:', deleteError)
    return NextResponse.json({ error: 'Erreur interne (suppression)' }, { status: 500 })
  }

  // 4. Générer un nouveau token
  const token = await createSession({ id: user.id })
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 jours

  // 5. Insérer le token en base
  const { error: insertError } = await supabase.from('tokens').insert([{
    token,
    user_id: user.id,
    is_valid: true,
    type: 'login',
    expires_at: expiresAt.toISOString(),
  }])

  if (insertError) {
    console.error('[LOGIN] Erreur enregistrement token:', insertError)
    return NextResponse.json({ error: 'Erreur interne (insertion)' }, { status: 500 })
  }

  // 6. Retourner la réponse OK
  return NextResponse.json({
    message: 'Connexion réussie',
    token,
    user: {
      id: user.id,
      email,
      username: user.username,
    },
  })
}
