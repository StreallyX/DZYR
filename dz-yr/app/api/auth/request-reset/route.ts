import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import { sendPasswordResetEmail } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email requis' }, { status: 400 })
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (error || !user) {
    return NextResponse.json({ message: 'Si cet email existe, un lien a été envoyé.' }) // pas d'info sensible
  }

  const token = uuidv4()
  const expires_at = new Date(Date.now() + 1000 * 60 * 30) // expire dans 30 minutes

  await supabase.from('tokens').insert({
    user_id: user.id,
    token,
    type: 'password_reset',
    expires_at: expires_at.toISOString(),
  })

  await sendPasswordResetEmail(email, token)

  return NextResponse.json({ message: 'Si cet email existe, un lien a été envoyé.' })
}
