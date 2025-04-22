import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')
const alg = 'HS256'

export async function createSession(user: { id: string }) {
  const token = await new SignJWT({ id: user.id })
    .setProtectedHeader({ alg })
    .setExpirationTime('7d')
    .sign(secret)

  return token
}

export async function getUserIdFromToken(token: string | null): Promise<string | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.id as string
  } catch {
    return null
  }
}
