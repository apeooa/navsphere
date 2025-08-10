// app/api/access/logout/route.ts
import { NextResponse } from 'next/server'
export const runtime = 'edge'

export async function POST() {
  const res = NextResponse.redirect(new URL('/access', process.env.NEXT_PUBLIC_API_URL))
  res.cookies.set('ns_access', '', { path: '/', maxAge: 0, httpOnly: true, secure: true, sameSite: 'lax' })
  return res
}
