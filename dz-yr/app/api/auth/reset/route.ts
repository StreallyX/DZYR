import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcrypt'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Token ou mot de passe manquant' }, { status: 400 })
  }

  const { data: tokenData, error: tokenError } = await supabase
    .from('tokens')
    .select('id, user_id, expires_at')
    .eq('token', token)
    .eq('type', 'password_reset')
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
  }

  const now = new Date()
  const expires = new Date(tokenData.expires_at)

  if (expires < now) {
    return NextResponse.json({ error: 'Token expiré' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 10)

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash })
    .eq('id', tokenData.user_id)

  if (updateError) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du mot de passe' }, { status: 500 })
  }

  await supabase.from('tokens').delete().eq('id', tokenData.id)

  return NextResponse.json({ message: 'Mot de passe mis à jour' })
}
