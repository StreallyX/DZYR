// /api/auth/register.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '@/lib/supabase'
import { sendVerificationEmail } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, username, password } = body

  if (!email || !username || !password) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  // Vérifie si l’utilisateur existe déjà
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .or(`email.eq.${email},username.eq.${username}`)
    .maybeSingle()

  if (existingUser) {
    return NextResponse.json({ error: 'Email ou nom d’utilisateur déjà utilisé' }, { status: 400 })
  }

  // Hash du mot de passe
  const password_hash = await bcrypt.hash(password, 10)

  // Création de l’utilisateur
  const { data: userInsert, error: userError } = await supabase
    .from('users')
    .insert({
      email,
      username,
      password_hash,
      is_verified: false,
    })
    .select()
    .single()

  if (userError || !userInsert) {
    return NextResponse.json({ error: 'Erreur lors de la création du compte' }, { status: 500 })
  }

  const token = uuidv4()
  const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24) // expire dans 24h

  // Enregistrement du token
  const { error: tokenError } = await supabase
    .from('tokens')
    .insert({
      user_id: userInsert.id,
      token,
      type: 'email_verification',
      expires_at: expires_at.toISOString(),
    })

  if (tokenError) {
    return NextResponse.json({ error: 'Erreur lors de la génération du token' }, { status: 500 })
  }

  // Envoi du mail de vérification
  console.log('[REGISTER]', 'Préparation de l’envoi de l’email', { email, token })
  await sendVerificationEmail(email, token)
  console.log('[REGISTER]', 'Email envoyé')


  return NextResponse.json({ message: 'Inscription réussie. Vérifie tes e-mails.' })
}
