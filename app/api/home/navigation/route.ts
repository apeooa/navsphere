import { NextResponse } from 'next/server'
import { getFileContent } from '@/lib/github'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const site = await getFileContent('site.json', { tag: 'site', revalidate: 3600 })
    const all  = await getFileContent('navigation.json', { tag: 'navigation', revalidate: 3600 })

    const defaultId = String(site?.defaultNavigationId ?? '')
    const items = Array.isArray(all?.navigationItems) ? all.navigationItems : []
    const picked = defaultId ? items.find((g: any) => String(g?.id) === defaultId) : items[0]

    return NextResponse.json({ navigationItems: picked ? [picked] : [] }, {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in navigation API:', error)
    return NextResponse.json({ error: '获取导航数据失败' }, { status: 500 })
  }
}
