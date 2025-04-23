import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { getUserIdFromToken } from '@/lib/session'

function encodeRobustLSB(pixels: Buffer, width: number, height: number, message: string, blockSize = 6): Buffer {
  const result = Buffer.from(pixels)
  let bitIndex = 0
  console.log('🔧 LSB encoding démarré')

  for (let i = 0; i < message.length; i++) {
    const charCode = message.charCodeAt(i)
    for (let b = 7; b >= 0; b--) {
      const bit = (charCode >> b) & 1
      const blocksPerRow = Math.floor(width / blockSize)
      const bx = (bitIndex % blocksPerRow) * blockSize
      const by = Math.floor(bitIndex / blocksPerRow) * blockSize

      for (let dx = 0; dx < blockSize; dx++) {
        for (let dy = 0; dy < blockSize; dy++) {
          const x = bx + dx
          const y = by + dy
          if (x >= width || y >= height) continue
          const idx = (y * width + x) * 4
          result[idx] = (result[idx] & 0b11111101) | (bit << 6)
        }
      }

      bitIndex++
    }
  }

  console.log('✅ LSB encoding terminé')
  return result
}

export async function GET(req: NextRequest) {
  console.log('🚀 [generate-image] Requête reçue')

  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')
    console.log('📦 path =', path)
    if (!path) return NextResponse.json({ error: 'Path manquant' }, { status: 400 })

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    console.log('🔐 Token =', token?.slice(0, 10) + '...')
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const userId = await getUserIdFromToken(token)
    console.log('👤 User ID =', userId)
    if (!userId) return NextResponse.json({ error: 'Utilisateur non connecté' }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username, email')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('❌ Erreur profil Supabase :', userError)
      return NextResponse.json({ error: 'Erreur profil', details: userError.message }, { status: 500 })
    }
    if (!user) {
      console.warn('❌ Aucun profil trouvé')
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 })
    }

    console.log('📄 Utilisateur identifié =', user.username || user.email)

    const { data: signed, error: signedError } = await supabase
      .storage
      .from('contents')
      .createSignedUrl(path, 60)

    if (signedError) {
      console.error('❌ Erreur URL signée :', signedError)
      return NextResponse.json({ error: 'Erreur URL signée', details: signedError.message }, { status: 500 })
    }
    if (!signed?.signedUrl) {
      console.warn('❌ Fichier introuvable dans le storage')
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 })
    }

    console.log('🔗 URL Supabase =', signed.signedUrl)

    const res = await fetch(signed.signedUrl)
    console.log('⏬ Téléchargement de l’image en cours... status =', res.status)
    if (!res.ok) {
      return NextResponse.json({ error: 'Téléchargement échoué', details: res.statusText }, { status: 500 })
    }

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('📥 Image téléchargée :', buffer.length, 'octets')

    const username = user.username || user.email || 'user'
    const trace = `TraceID:${userId.slice(0, 16)}`
    console.log('🔍 trace =', trace)

    let original
    try {
      console.log('🛠️ Appel de sharp(buffer)...')
      original = sharp(buffer).ensureAlpha()
    } catch (e: any) {
      console.error('💥 sharp(buffer) failed :', e)
      return NextResponse.json({ error: 'Erreur sharp', details: e.message }, { status: 500 })
    }

    let metadata
    try {
      metadata = await original.metadata()
      console.log('📐 Metadata =', metadata)
    } catch (e: any) {
      console.error('💥 metadata() failed :', e)
      return NextResponse.json({ error: 'Erreur metadata', details: e.message }, { status: 500 })
    }

    const width = metadata.width || 600
    const height = metadata.height || 600
    console.log('📏 width =', width, '| height =', height)

    const watermarkSvg = Buffer.from(`
      <svg width="${width}" height="50">
        <style>.text { font-size: 20px; fill: white; font-family: Arial; }</style>
        <text x="10" y="35" class="text">@${username} – DZYR</text>
      </svg>
    `)

    let composited
    try {
      console.log('🎨 Composition avec watermark...')
      composited = await original
        .composite([{ input: watermarkSvg, top: height - 50, left: 0 }])
        .raw()
        .toBuffer({ resolveWithObject: true })
      console.log('✅ Composition réussie')
    } catch (e: any) {
      console.error('💥 Erreur watermark/composite :', e)
      return NextResponse.json({ error: 'Erreur watermark', details: e.message }, { status: 500 })
    }

    const encoded = encodeRobustLSB(
      composited.data,
      composited.info.width,
      composited.info.height,
      trace,
      6
    )

    console.log('📦 sharp final pour PNG...')
    const finalPng = await sharp(encoded, {
      raw: {
        width: composited.info.width,
        height: composited.info.height,
        channels: composited.info.channels,
      },
    }).png().toBuffer()

    console.log('✅ Image finale générée')
    return new NextResponse(finalPng, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })

  } catch (err: any) {
    console.error('🔥 [generate-image] ERREUR GLOBALE :', err)
    return NextResponse.json({ error: 'Erreur serveur interne', details: err.message }, { status: 500 })
  }
}
