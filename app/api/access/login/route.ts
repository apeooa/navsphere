import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}))
  const configured = process.env.SITE_ACCESS_PASSWORD || ''
  if (!configured) {
    return NextResponse.json({ error: 'SITE_ACCESS_PASSWORD 未配置' }, { status: 500 })
  }
  if (password !== configured) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 })
  }

  const secret = process.env.SITE_ACCESS_SECRET || ''
  const token = crypto.createHash('sha256').update(configured + secret).digest('hex')

  const res = NextResponse.json({ ok: true })
  res.cookies.set('ns_access', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    // 5 年（你可以改更长）
    maxAge: 60 * 60 * 24 * 365 * 5,
  })
  return res
}
