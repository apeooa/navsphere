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
    const siteData = await fetchFromDataRepo('site.json')
    return NextResponse.json(siteData, {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in site API:', error)
    return NextResponse.json(
      { error: '获取站点数据失败' },
      { status: 500 }
    )
  }
}
