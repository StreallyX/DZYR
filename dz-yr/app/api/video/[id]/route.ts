import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const contentId = params.id
  console.log("📥 Requête vidéo reçue pour ID :", contentId)

  const session = await supabase.auth.getSession()
  const user = session.data.session?.user
  if (!user) {
    console.log("⛔ Utilisateur non connecté")
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  console.log("✅ Utilisateur connecté :", user.id)

  // Récupérer le contenu
  const { data: content, error } = await supabase
    .from('contents')
    .select('*')
    .eq('id', contentId)
    .single()

  if (error || !content) {
    console.log("❌ Contenu introuvable ou erreur DB :", error)
    return NextResponse.json({ error: 'Contenu introuvable' }, { status: 404 })
  }

  console.log("🎬 Contenu trouvé :", content.media_path)

  // Vérification d’accès
  const isOwner = content.user_id === user.id
  const isFree = content.is_free
  const isSubRequired = content.sub_required
  const isPaid = content.is_shop_item

  let hasAccess = false

  if (isFree || isOwner) {
    hasAccess = true
    console.log("✅ Accès autorisé (gratuit ou propriétaire)")
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
    } else {
      console.log("⛔ Pas d'abonnement actif")
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
    } else {
      console.log("⛔ Aucun achat trouvé")
    }
  }

  if (!hasAccess) {
    console.log("⛔ Accès refusé")
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('contents')
    .createSignedUrl(content.media_path, 60)

  if (signError || !signed?.signedUrl) {
    console.log("❌ Erreur génération signed URL :", signError)
    return NextResponse.json({ error: 'Erreur URL signée' }, { status: 500 })
  }

  console.log("🔐 Redirection vers signed URL :", signed.signedUrl)
  return NextResponse.redirect(signed.signedUrl, 302)
}
