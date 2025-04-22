// /api/auth/logout.ts
import { supabase } from '@/lib/supabase'
import { getUserIdFromToken } from '@/lib/session'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || null

  if (!token) {
    return NextResponse.json({ error: 'Aucun token fourni' }, { status: 400 })
  }

  const userId = await getUserIdFromToken(token)
  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non connecté' }, { status: 401 })
  }

  // ✅ Supprimer tous les tokens liés à cet utilisateur
  const { error } = await supabase
    .from('tokens')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('[LOGOUT] Erreur suppression des tokens :', error)
    return NextResponse.json({ error: 'Erreur logout' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Déconnexion réussie' })
}
