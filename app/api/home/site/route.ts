import { NextResponse } from 'next/server'
import { getFileContent } from '@/lib/github'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 仅当像是本地图片路径时才改写到 /api/assets/...
const isLocalAssetPath = (p: string) =>
  /^\/(public\/)?assets\/.+\.(png|jpe?g|gif|webp|svg|ico)$/i.test(p)

function toAssetProxy(p?: string) {
  if (!p || /^https?:\/\//i.test(p) || p.startsWith('data:')) return p
  if (!isLocalAssetPath(p)) return p
  const clean = p.replace(/^\/+/, '')
  const repoPath = clean.startsWith('assets/') ? `public/${clean}` : clean
  return `/api/assets/${repoPath}`
}

export async function GET() {
  try {
    // 固定读取 navsphere/content/site.json
    const site: any = await getFileContent('navsphere/content/site.json')

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
