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
    let navigationData = await getFileContent('navigation.json')

    // 递归替换所有 items 里的 icon 路径
    function replaceIcons(items: any[]) {
      return items.map(item => {
        if (item.icon) {
          item.icon = withRawGitHubUrl(item.icon)
        }
        if (item.items) {
          item.items = replaceIcons(item.items)
        }
        if (item.subCategories) {
          item.subCategories = replaceIcons(item.subCategories)
        }
        return item
      })
    }

    if (navigationData?.navigationItems) {
      navigationData.navigationItems = replaceIcons(navigationData.navigationItems)
    }

    return NextResponse.json(navigationData, {
      headers: {
        'Cache-Control': 'no-store', // 避免缓存
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error in navigation API:', error)
    return NextResponse.json({ error: '获取导航数据失败' }, { status: 500 })
  }
}
