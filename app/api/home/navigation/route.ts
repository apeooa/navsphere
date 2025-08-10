import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const OWNER  = process.env.GITHUB_OWNER!
const REPO   = process.env.GITHUB_REPO!
const BRANCH = process.env.GITHUB_BRANCH || 'main'

async function fetchFromDataRepo(path: string) {
  const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Fetch ${path} failed: ${res.status}`)
  return res.json()
}

export async function GET() {
  try {
    // 1) 读 site.json 拿默认导航 ID
    const site = await fetchFromDataRepo('site.json')
    const defaultId = site?.defaultNavigationId

    // 2) 读导航数据
    const all = await fetchFromDataRepo('navigation.json')
    const arr = Array.isArray(all?.navigationItems) ? all.navigationItems : []

    // 3) 只返回默认导航（找不到就回退第一个）
    const picked = defaultId
      ? arr.find((g: any) => String(g?.id) === String(defaultId))
      : arr[0]

    const payload = { navigationItems: picked ? [picked] : [] }

    return NextResponse.json(payload, {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in navigation API:', error)
    return NextResponse.json(
      { error: '获取导航数据失败' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
