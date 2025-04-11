// app/api/protected-image/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // pas le anon key ici
)

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const path = url.searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Paramètre "path" manquant.' }, { status: 400 })
  }

  // ⚠️ Authentification utilisateur
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return new Response('Non autorisé', { status: 401 })

  const { data: userData, error: userError } = await supabase.auth.getUser(token)

  if (userError || !userData?.user) {
    return new Response('Non authentifié', { status: 401 })
  }

  // 📸 Générer signed URL
  const { data, error } = await supabase.storage
    .from('contents')
    .createSignedUrl(path, 60)

  if (error || !data?.signedUrl) {
    return new Response('Image introuvable', { status: 404 })
  }

  // 🔁 Redirection vers l’image
  return NextResponse.redirect(data.signedUrl)
}
