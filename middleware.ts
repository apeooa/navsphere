// middleware.ts（放在项目根目录，不要在 app/ 里再放一个）
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// 计算 sha256(pw + secret) → 作为 cookie 值
async function sha256Hex(s: string) {
  const data = new TextEncoder().encode(s)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // 1) 站点访问密码（全站生效）
  const pw = process.env.SITE_ACCESS_PASSWORD || ''
  if (pw) {
    const secret = process.env.SITE_ACCESS_SECRET || ''
    const expected = await sha256Hex(pw + secret)
    const cookie = req.cookies.get('ns_access')?.value || ''

    if (cookie !== expected) {
      // 未通过 → 跳转到 /access（带回跳地址）
      const url = req.nextUrl.clone()
      url.pathname = '/access'
      url.search = '' // 先清空再设置
      url.searchParams.set('next', pathname + search)
      return NextResponse.redirect(url)
    }
  }

  // 2) /admin 区域再做 NextAuth 登录校验
  if (pathname.startsWith('/admin')) {
    const session = await auth()
    if (!session?.user) {
      const url = req.nextUrl.clone()
      url.pathname = '/auth/signin'
      url.search = '' // 先清空再设置
      url.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

// 只排除必须放行的路径，其它全部受保护（包含 /api/home 等）
export const config = {
  matcher: [
    // 负向前瞻：排除 _next 静态、图片优化、公开静态文件、登录/鉴权与图片代理等必要接口
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|access|api/access|api/health|api/assets|api/auth|auth).*)',
  ],
}
