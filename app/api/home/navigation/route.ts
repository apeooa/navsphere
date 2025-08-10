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

// 递归：只改写真正的图片路径，像 "FolderKanban" 之类图标名不动
const transformNode = (node: any): any => {
  if (!node || typeof node !== 'object') return node
  if (node.icon) node.icon = toAssetProxy(node.icon)
  if (Array.isArray(node.items)) node.items = node.items.map(transformNode)
  if (Array.isArray(node.subCategories)) node.subCategories = node.subCategories.map(transformNode)
  return node
}

async function readSite() {
  return await getFileContent('navsphere/content/site.json')
}

async function readNavigation() {
  const data = await getFileContent('navsphere/content/navigation.json')
  return Array.isArray(data?.navigationItems) ? data.navigationItems : []
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const wantAll = url.searchParams.get('all')
    const wantId = url.searchParams.get('id')

    const [site, list] = await Promise.all([readSite(), readNavigation()])

    // all=1 → 返回所有分组
    if (wantAll === '1' || wantAll === 'true') {
      const allGroups = list.map(transformNode)
      return NextResponse.json({ navigationItems: allGroups }, { headers: { 'Content-Type': 'application/json' } })
    }

    // id=xxx → 返回指定分组
    let picked = wantId
      ? list.find((g: any) => String(g?.id) === String(wantId))
      : null

    // 默认：返回 defaultNavigationId 指定分组；没有就第一个
    if (!picked) {
      const defaultId = String(site?.defaultNavigationId ?? '')
      picked = defaultId ? list.find((g: any) => String(g?.id) === defaultId) : list[0]
    }

    const payload = { navigationItems: picked ? [transformNode(picked)] : [] }
    return NextResponse.json(payload, { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Error in /api/home/navigation:', error)
    return NextResponse.json({ error: '获取导航数据失败' }, { status: 500 })
  }
}
