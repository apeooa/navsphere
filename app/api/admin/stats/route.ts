import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL!
    const cookie = request.headers.get('cookie') || ''

    // 复用现有导航 API，转发 cookie（带站点密码的 cookie）
    const navRes = await fetch(new URL('/api/home/navigation', base).toString(), {
      headers: { cookie },
      cache: 'no-store',
      next: { revalidate: 0 },
    })

    if (!navRes.ok) {
      return NextResponse.json(
        { error: 'failed_to_fetch_navigation', status: navRes.status },
        { status: navRes.status }
      )
    }

    const nav = await navRes.json()
    const groups = Array.isArray(nav?.navigationItems) ? nav.navigationItems : []

    let top = 0
    let second = 0
    let sites = 0

    for (const g of groups) {
      top += 1
      if (Array.isArray(g.items)) {
        sites += g.items.filter((it: any) => (it?.enabled ?? true)).length
      }
      if (Array.isArray(g.subCategories)) {
        second += g.subCategories.length
        for (const sc of g.subCategories) {
          if (Array.isArray(sc.items)) {
            sites += sc.items.filter((it: any) => (it?.enabled ?? true)).length
          }
        }
      }
    }
    return NextResponse.json({
      totalCategories: top + second,
      parentCategories: top,     // ← 改名
      subCategories: second,     // ← 改名
      totalSites: sites,
      updatedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } })

  } catch (err: any) {
    return NextResponse.json(
      { error: 'stats_error', message: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
