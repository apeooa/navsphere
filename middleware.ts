// middleware.ts（放项目根目录）
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// 计算 sha256(pw + secret) → 作为 cookie 值
async function sha256Hex(s: string) {
  const data = new TextEncoder().encode(s)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// 放行的路径（登录页、图片代理、NextAuth、静态资源等）
function bypass(pathname: string) {
  return (
    pathname.startsWith('/access') ||
    pathname.startsWith('/api/access') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/assets') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  )
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // 1) 站点访问密码（除放行路径外都拦）
  if (!bypass(pathname)) {
    const pw = process.env.SITE_ACCESS_PASSWORD || ''
    if (pw) {
      const secret = process.env.SITE_ACCESS_SECRET || ''
      const expected = await sha256Hex(pw + secret)
      const cookie = req.cookies.get('ns_access')?.value || ''
      if (cookie !== expected) {
        const url = req.nextUrl.clone()
        url.pathname = '/access'
        url.search = ''
        url.searchParams.set('next', pathname + search)
        return NextResponse.redirect(url)
      }
    }
  }

  // 2) /admin 需要 NextAuth 登录
  if (pathname.startsWith('/admin')) {
    const session = await auth()
    if (!session?.user) {
      const url = req.nextUrl.clone()
      url.pathname = '/auth/signin'
      url.search = ''
      url.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(url)
    }
  }
  // 改成同时拦 /api/admin
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const session = await auth()
    if (!session?.user) {
      const url = req.nextUrl.clone()
      url.pathname = '/auth/signin'
      url.search = ''
      url.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

// 用通配 matcher，然后在函数里做 bypass
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
