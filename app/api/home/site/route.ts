import { NextResponse } from 'next/server'
import { getFileContent } from '@/lib/github'

export const runtime = 'edge'

const owner = process.env.GITHUB_OWNER!
const repo = process.env.GITHUB_REPO!
const branch = process.env.GITHUB_BRANCH || 'main'

function withRawGitHubUrl(path: string) {
  if (!path) return path
  if (path.startsWith('/assets/')) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}${path}`
  }
  return path
}

export async function GET() {
  try {
    const siteData: any = await getFileContent('site.json')

    if (siteData?.appearance?.logo) {
      siteData.appearance.logo = withRawGitHubUrl(siteData.appearance.logo)
    }
    if (siteData?.appearance?.favicon) {
      siteData.appearance.favicon = withRawGitHubUrl(siteData.appearance.favicon)
    }

    return NextResponse.json(siteData)
  } catch (error) {
    console.error('Error in site API:', error)
    return NextResponse.json({ error: '获取站点数据失败' }, { status: 500 })
  }
}
