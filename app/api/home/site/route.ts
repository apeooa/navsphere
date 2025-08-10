import { NextResponse } from 'next/server'
import { getFileContent } from '@/lib/github'

export const runtime = 'nodejs'          // revalidateTag 需要 nodejs
export const dynamic = 'force-dynamic'   // 始终服务端渲染

export async function GET() {
  try {
    const site = await getFileContent('site.json', { tag: 'site', revalidate: 3600 })
    return NextResponse.json(site, { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Error in site API:', error)
    return NextResponse.json({ error: '获取站点数据失败' }, { status: 500 })
  }
}
