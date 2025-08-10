import { NextResponse } from 'next/server'
import { getFileContent } from '@/lib/github'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 统一把图标路径改成 API 代理（支持私库）
function toAssetProxy(p?: string) {
  if (!p || /^https?:\/\//i.test(p)) return p
  const clean = p.replace(/^\/+/, '')
  const repoPath = clean.startsWith('assets/') ? `public/${clean}` : clean
  return `/api/assets/${repoPath}`
}

// 递归处理任意层级的 items / subCategories
const transformNode = (node: any): any => {
  if (!node || typeof node !== 'object') return node
  if (node.icon) node.icon = toAssetProxy(node.icon)
  if (Array.isArray(node.items)) node.items = node.items.map(transformNode)
  if (Array.isArray(node.subCategories)) node.subCategories = node.subCategories.map(transformNode)
  return node
}

export async function GET() {
  try {
    // 兼容你当前的 getFileContent 签名
    const site: any = await getFileContent('site.json')
    const all: any  = await getFileContent('navigation.json')

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
