import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon'
}

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const owner  = process.env.GITHUB_OWNER!
  const repo   = process.env.GITHUB_REPO!
  const branch = process.env.GITHUB_BRANCH || 'main'
  const token  = process.env.GITHUB_PERSONAL_TOKEN

  const rel = params.path.join('/') // 例如 public/assets/favicon_123.png
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${rel}?ref=${branch}`

  const res = await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3.raw', ...(token ? { Authorization: `token ${token}` } : {}), 'User-Agent': 'NavSphere' },
    cache: 'no-store'
  })
  if (!res.ok) return new NextResponse('Not Found', { status: 404 })

  const buf = Buffer.from(await res.arrayBuffer())
  const ext = rel.split('.').pop()?.toLowerCase() || ''
  return new NextResponse(buf, {
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=60, s-maxage=600'
    }
  })
}
