import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { getUserIdFromToken } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')
    if (!path) return NextResponse.json({ error: 'Path manquant' }, { status: 400 })

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const userId = await getUserIdFromToken(token)
    if (!userId) return NextResponse.json({ error: 'Utilisateur non connecté' }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: user } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', userId)
      .single()

    if (!user) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

    const { data: signed } = await supabase.storage
      .from('contents')
      .createSignedUrl(path, 60)

    if (!signed?.signedUrl) {
      return NextResponse.json({ error: 'Erreur URL signée' }, { status: 500 })
    }

    const res = await fetch(signed.signedUrl)
    if (!res.ok) {
      return NextResponse.json({ error: 'Téléchargement échoué' }, { status: 500 })
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const username = user.username || user.email || 'user'

    // 🖼 Préparation image
    const image = sharp(buffer).ensureAlpha()
    const metadata = await image.metadata()
    const width = metadata.width || 600
    const height = metadata.height || 600

    // 🔖 SVG watermark adapté à la largeur de l'image
    const watermarkSvg = Buffer.from(`
      <svg width="${width}" height="40">
        <style>.text { font-size: 20px; fill: white; font-family: Arial; }</style>
        <text x="10" y="25" class="text">@${username} – DZYR</text>
      </svg>
    `)

    const final = await image
      .composite([{ input: watermarkSvg, top: height - 40, left: 0 }])
      .png()
      .toBuffer()

    return new NextResponse(final, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })

  } catch (err: any) {
    console.error('🔥 [protected-image] Erreur :', err)
    return NextResponse.json({ error: 'Erreur serveur interne', details: err.message }, { status: 500 })
  }
}
