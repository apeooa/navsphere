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

export async function GET() {
  try {
    // 固定读取 navsphere/content 下的两个文件
    const site: any = await getFileContent('navsphere/content/site.json')
    const all:  any = await getFileContent('navsphere/content/navigation.json')

    const defaultId = String(site?.defaultNavigationId ?? '')
    const list = Array.isArray(all?.navigationItems) ? all.navigationItems : []

    const picked = defaultId
      ? list.find((g: any) => String(g?.id) === defaultId)
      : list[0]

    const payload = { navigationItems: picked ? [transformNode(picked)] : [] }

    return NextResponse.json(payload, { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Error in /api/home/navigation:', error)
    return NextResponse.json({ error: '获取导航数据失败' }, { status: 500 })
  }
}
