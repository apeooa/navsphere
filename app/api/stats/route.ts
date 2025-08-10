// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const runtime = 'edge' // 如需用 next-auth 检查登录，改成 'nodejs'

function countLinks(nav: any) {
  let total = 0
  const groups = nav?.navigationItems ?? []
  for (const g of groups) {
    total += (g.items ?? []).length
    for (const sc of g.subCategories ?? []) {
      total += (sc.items ?? []).length
    }
  }
  return { groupCount: groups.length, itemCount: total }
}

export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL!
    // 把访问者的 Cookie 转发给内部 API（带上 ns_access 等）
    const cookie = headers().get('cookie') ?? ''

    const [navRes, siteRes] = await Promise.all([
      fetch(new URL('/api/home/navigation', base).toString(), {
        headers: { cookie }, cache: 'no-store',
      }),
      fetch(new URL('/api/home/site', base).toString(), {
        headers: { cookie }, cache: 'no-store',
      }),
    ])

    if (!navRes.ok || !siteRes.ok) {
      return NextResponse.json(
        { error: 'upstream api failed' },
        { status: 502 },
      )
    }

    const nav = await navRes.json()
    const site = await siteRes.json()
    const { groupCount, itemCount } = countLinks(nav)

    return NextResponse.json({
      ok: true,
      site: {
        title: site?.basic?.title ?? 'NavSphere',
        theme: site?.appearance?.theme ?? 'system',
      },
      counts: { groups: groupCount, items: itemCount },
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ ok: false, message: String(e) }, { status: 500 })
  }
}
