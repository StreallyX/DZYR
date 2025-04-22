import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserIdFromToken } from '@/lib/session'

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { params } = context
  const contentId = params.id
  console.log("📥 Requête vidéo reçue pour ID :", contentId)

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    console.log("⛔ Token manquant")
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const userId = await getUserIdFromToken(token)
  if (!userId) {
    console.log("⛔ Utilisateur non connecté (token invalide)")
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!userProfile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 401 })
  }

  const { data: content, error } = await supabase
    .from('contents')
    .select('*')
    .eq('id', contentId)
    .single()

  if (error || !content) {
    return NextResponse.json({ error: 'Contenu introuvable' }, { status: 404 })
  }

  const isOwner = content.user_id === userId
  const isFree = content.is_free
  const isSubRequired = content.sub_required
  const isPaid = content.is_shop_item

  let hasAccess = false

  if (isFree || isOwner) {
    hasAccess = true
  }

  if (!hasAccess && isSubRequired) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('creator_id', content.user_id)
      .eq('subscriber_id', userId)
      .gte('end_date', new Date().toISOString())
      .maybeSingle()

    if (sub) hasAccess = true
  }

  if (!hasAccess && isPaid) {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('buyer_id', userId)
      .eq('content_id', content.id)
      .maybeSingle()

    if (purchase) hasAccess = true
  }

  if (!hasAccess) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('contents')
    .createSignedUrl(content.media_path, 60)

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Erreur URL signée' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl, 302)
}
