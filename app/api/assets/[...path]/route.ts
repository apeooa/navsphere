import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const owner  = process.env.GITHUB_OWNER!
  const repo   = process.env.GITHUB_REPO!
  const branch = process.env.GITHUB_BRANCH || 'main'
  const token  = process.env.GITHUB_PERSONAL_TOKEN! // 细粒度 PAT：只授 navsphere-data → Contents: Read

  // 例如：请求 /api/assets/public/assets/favicon.png
  const relPath = params.path.join('/') // → public/assets/favicon.png

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${relPath}?ref=${branch}`
  const res = await fetch(apiUrl, {
    headers: {
      Accept: 'application/vnd.github.v3.raw', // 直接拿文件二进制
      Authorization: `token ${token}`,
      'User-Agent': 'NavSphere',
    },
  })

  if (!res.ok) return new NextResponse('Not Found', { status: 404 })

  const buf = await res.arrayBuffer()
  const ct = res.headers.get('content-type') || 'application/octet-stream'

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': ct,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
