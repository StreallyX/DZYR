import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

// 🔐 Encode chaque bit dans le 2ᵉ bit du canal rouge, bloc 6x6
function encodeRobustLSB(pixels: Buffer, width: number, height: number, message: string, blockSize = 6): Buffer {
  const result = Buffer.from(pixels)
  let bitIndex = 0

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
          // Encode dans le 2ᵉ bit (bit 1), donc valeur +2 ou -2
          result[idx] = (result[idx] & 0b11111101) | (bit << 6)
        }
      }

      bitIndex++
    }
  }

  return result
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Path manquant' }, { status: 400 })

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Utilisateur non connecté' }, { status: 401 })

  const { data: signed } = await supabase.storage
    .from('contents')
    .createSignedUrl(path, 60)
  if (!signed?.signedUrl) return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 })

  const res = await fetch(signed.signedUrl)
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const username = user.user_metadata?.username || user.email || 'user'
  const trace = `TraceID:${user.id.slice(0, 16)}`

  const original = sharp(buffer).ensureAlpha()
  const { width = 600, height = 600 } = await original.metadata()

  const watermarkSvg = Buffer.from(`
    <svg width="${width}" height="50">
      <style>.text { font-size: 20px; fill: white; font-family: Arial; }</style>
      <text x="10" y="35" class="text">@${username} – DZYR</text>
    </svg>
  `)

  const composited = await original
    .composite([{ input: watermarkSvg, top: height - 50, left: 0 }])
    .raw()
    .toBuffer({ resolveWithObject: true })

  const encoded = encodeRobustLSB(
    composited.data,
    composited.info.width,
    composited.info.height,
    trace,
    6
  )

  const finalPng = await sharp(encoded, {
    raw: {
      width: composited.info.width,
      height: composited.info.height,
      channels: composited.info.channels,
    },
  }).png().toBuffer()

  return new NextResponse(finalPng, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  })
}
