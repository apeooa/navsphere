// app/api/access/login/route.ts
export const runtime = 'edge'

async function sha256Hex(s: string) {
  const data = new TextEncoder().encode(s)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(req: Request) {
  // 同时兼容 form POST 与 JSON POST
  const ct = req.headers.get('content-type') || ''
  let password = ''
  let next = '/'

  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await req.formData()
    password = String(form.get('password') ?? '')
    next = String(form.get('next') ?? '/')
  } else {
    const body = await req.json().catch(() => ({} as any))
    password = String(body?.password ?? '')
    next = String(body?.next ?? '/')
  }

  const pw = process.env.SITE_ACCESS_PASSWORD || ''
  const secret = process.env.SITE_ACCESS_SECRET || ''
  if (!pw || password !== pw) {
    return new Response(JSON.stringify({ error: '密码错误' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  const cookie = await sha256Hex(pw + secret)
  const headers = new Headers()
  // 5 年有效期，可按需调整
  headers.set(
    'Set-Cookie',
    `ns_access=${cookie}; Path=/; Max-Age=${60 * 60 * 24 * 365 * 5}; HttpOnly; Secure; SameSite=Lax`
  )

  // 规范化 next，优先允许相对路径
  try {
    // 如果是绝对 URL，需要确保是本站；否则回退到根目录
    const u = new URL(next, 'https://example.com') // 基底无所谓，这里只做解析
    if (u.origin !== 'https://example.com' && !next.startsWith('/')) next = '/'
  } catch {
    // 不是合法 URL，当作相对路径
    if (!next.startsWith('/')) next = '/' + next
  }

  headers.set('Location', next)
  // 303 让浏览器自动跟随重定向，避免客户端路由
  return new Response(null, { status: 303, headers })
}
