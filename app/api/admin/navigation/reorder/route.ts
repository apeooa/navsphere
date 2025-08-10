import { NextRequest, NextResponse } from 'next/server'
import { getFileContent } from '@/lib/github'
import { auth } from '@/lib/auth'
import { commitFile } from '@/lib/github'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { groupId, order } = await req.json() as { groupId: string; order: string[] }
    if (!groupId || !Array.isArray(order)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }

    // 读取当前 navigation.json
    const path = 'navsphere/content/navigation.json'
    const data: any = await getFileContent(path)
    if (!data || !Array.isArray(data.navigationItems)) {
      return NextResponse.json({ error: '导航数据不存在或格式错误' }, { status: 500 })
    }

    // 找到目标分组
    const groups = data.navigationItems
    const idx = groups.findIndex((g: any) => String(g?.id) === String(groupId))
    if (idx === -1) {
      return NextResponse.json({ error: '未找到分组' }, { status: 404 })
    }

    const group = groups[idx]
    const items = Array.isArray(group.items) ? group.items : []

    // 生成新的 items 顺序
    const map = new Map(items.map((it: any) => [String(it.id), it]))
    const newItems = order
      .map(id => map.get(String(id)))
      .filter(Boolean)

    // 把未出现在 order 里的（可能是新加的）拼到末尾，避免丢失
    const orderedSet = new Set(order.map(String))
    const leftovers = items.filter((it: any) => !orderedSet.has(String(it.id)))
    group.items = [...newItems, ...leftovers]

    // 提交到 GitHub（优先用会话 token，回退到 PAT）
    const session = await auth().catch(() => null)
    const token =
      (session?.user as any)?.accessToken ||
      process.env.GITHUB_PERSONAL_TOKEN // 需要对 navsphere-data 有 Contents: Read/Write

    if (!token) {
      return NextResponse.json({ error: '缺少写入权限（无会话token或PAT）' }, { status: 401 })
    }

    const content = JSON.stringify(data, null, 2)
    await commitFile(
      path,
      content,
      `chore: reorder items in group ${groupId}`,
      token
    )

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('reorder error', e)
    return NextResponse.json({ error: e?.message || '保存失败' }, { status: 500 })
  }
}
