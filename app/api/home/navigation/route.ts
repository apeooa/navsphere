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

// 放在函数外：避免“strict mode 下块级 function 声明”报错
const transformNode = (node: any): any => {
  if (!node || typeof node !== 'object') return node

  if (node.icon) node.icon = withRawGitHubUrl(node.icon)

  if (Array.isArray(node.items)) {
    node.items = node.items.map(transformNode)
  }
  if (Array.isArray(node.subCategories)) {
    node.subCategories = node.subCategories.map(transformNode)
  }
  return node
}

export async function GET() {
  try {
    const data: any = await getFileContent('navigation.json')

    if (Array.isArray(data?.navigationItems)) {
      data.navigationItems = data.navigationItems.map(transformNode)
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error in navigation API:', error)
    return NextResponse.json({ error: '获取导航数据失败' }, { status: 500 })
  }
}
