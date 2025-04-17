import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { params } = context
  const contentId = params.id
  console.log("📥 Requête vidéo reçue pour ID :", contentId)

  // 🔐 Lire le token envoyé depuis le client
  const access_token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!access_token) {
    console.log("⛔ Token manquant")
    return NextResponse.json({ error: 'Non authentifié (pas de token)' }, { status: 401 })
  }

  // 🔗 Crée un client Supabase côté serveur avec le token utilisateur
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    }
  )

  // 📡 Récupérer l'utilisateur
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user) {
    console.log("⛔ Utilisateur non connecté via Supabase :", userError)
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  console.log("✅ Utilisateur connecté :", user.id)

  // 🎬 Charger le contenu
  const { data: content, error } = await supabase
    .from('contents')
    .select('*')
    .eq('id', contentId)
    .single()

  if (error || !content) {
    console.log("❌ Contenu introuvable :", error)
    return NextResponse.json({ error: 'Contenu introuvable' }, { status: 404 })
  }

  // 🔐 Vérification d’accès
  const isOwner = content.user_id === user.id
  const isFree = content.is_free
  const isSubRequired = content.sub_required
  const isPaid = content.is_shop_item

  let hasAccess = false

  if (isFree || isOwner) {
    hasAccess = true
    console.log("✅ Accès autorisé (gratuit ou créateur)")
  }

  if (!hasAccess && isSubRequired) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('creator_id', content.user_id)
      .eq('subscriber_id', user.id)
      .gte('end_date', new Date().toISOString())
      .maybeSingle()

    if (sub) {
      hasAccess = true
      console.log("✅ Accès autorisé via abonnement actif")
    }
  }

  if (!hasAccess && isPaid) {
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('buyer_id', user.id)
      .eq('content_id', content.id)
      .maybeSingle()

    if (purchase) {
      hasAccess = true
      console.log("✅ Accès autorisé via achat")
    }
  }

  if (!hasAccess) {
    console.log("⛔ Accès refusé")
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  // 🔑 Générer URL temporaire Supabase
  const { data: signed, error: signError } = await supabase.storage
    .from('contents')
    .createSignedUrl(content.media_path, 60)

  if (signError || !signed?.signedUrl) {
    console.log("❌ Erreur URL signée :", signError)
    return NextResponse.json({ error: 'Erreur URL signée' }, { status: 500 })
  }

  console.log("🔐 Redirection vers signed URL :", signed.signedUrl)
  return NextResponse.redirect(signed.signedUrl, 302)
}
