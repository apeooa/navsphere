import { NextResponse } from 'next/server'
import { getFileContent } from '@/lib/github'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 把 '/assets/...' 或 '/public/assets/...' 改写为 '/api/assets/public/assets/...'
function toAssetProxy(p?: string) {
  if (!p || /^https?:\/\//i.test(p)) return p
  const clean = p.replace(/^\/+/, '')
  const repoPath = clean.startsWith('assets/') ? `public/${clean}` : clean
  return `/api/assets/${repoPath}`
}

export async function GET() {
  try {
    // 这里不传第二个参数，兼容你当前的 getFileContent(path: string) 签名
    const site: any = await getFileContent('site.json')

    if (site?.appearance) {
      site.appearance.logo = toAssetProxy(site.appearance.logo)
      site.appearance.favicon = toAssetProxy(site.appearance.favicon)
    }

    return NextResponse.json(site, { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Error in /api/home/site:', error)
    return NextResponse.json({ error: '获取站点数据失败' }, { status: 500 })
  }
}
