import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Path manquant' }, { status: 400 })
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Utilisateur non connecté' }, { status: 401 })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('contents')
    .createSignedUrl(path, 60)

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Erreur URL signée' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl, 302)
}
