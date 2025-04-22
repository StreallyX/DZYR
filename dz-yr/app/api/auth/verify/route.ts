// /api/auth/verify.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
  }

  const { data: tokenData, error: tokenError } = await supabase
    .from('tokens')
    .select('id, user_id, expires_at')
    .eq('token', token)
    .eq('type', 'email_verification')
    .single()

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
  }

  const now = new Date()
  const expires = new Date(tokenData.expires_at)

  if (expires < now) {
    return NextResponse.json({ error: 'Token expiré' }, { status: 400 })
  }

  // Met à jour l’utilisateur
  const { error: updateError } = await supabase
    .from('users')
    .update({ is_verified: true })
    .eq('id', tokenData.user_id)

  if (updateError) {
    return NextResponse.json({ error: 'Erreur lors de la validation du compte' }, { status: 500 })
  }

  // Supprime le token
  await supabase.from('tokens').delete().eq('id', tokenData.id)

  return NextResponse.json({ message: 'Email vérifié avec succès' })
}
