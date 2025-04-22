import { supabase } from '@/lib/supabase'
import { getUserIdFromToken } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || null

  if (!token) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const userId = await getUserIdFromToken(token)
  if (!userId) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  // ✅ Vérifie que le token est bien enregistré en base
  const { data: validToken } = await supabase
    .from('tokens')
    .select('id')
    .eq('token', token)
    .single()

  if (!validToken) {
    return NextResponse.json({ error: 'Token expiré ou supprimé' }, { status: 401 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, email, username, bio, avatar_url')
    .eq('id', userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  }

  return NextResponse.json({ user })
}
