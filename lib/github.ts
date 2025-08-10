// lib/github.ts
import { auth } from '@/lib/auth'

type FetchOpts = { tag?: string; revalidate?: number }

export async function getFileContent(path: string, opts: FetchOpts = {}) {
  const owner  = process.env.GITHUB_OWNER!
  const repo   = process.env.GITHUB_REPO!
  const branch = process.env.GITHUB_BRANCH || 'main'

  try {
    // 1) 优先用登录会话 token（后台保存时一般有），否则回退到 PAT（支持私库/无登录场景）
    const session = await auth().catch(() => null as any)
    const sessionToken = session?.user?.accessToken
    const pat = process.env.GITHUB_PERSONAL_TOKEN
    const token = sessionToken || pat // 两者都没有时读取公库也能用

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`

    const res = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github.v3.raw', // 直接拿文件原文
        Authorization: token ? `token ${token}` : '',
        'User-Agent': 'NavSphere',
      },
      // 给 Next 的 ISR 打标签（用于 revalidateTag）；不设置就走默认缓存策略
      // @ts-ignore
      next: opts.tag ? { tags: [opts.tag], revalidate: opts.revalidate ?? 3600 } : undefined,
    })

    if (res.status === 404) {
      console.log(`File not found: ${path}, returning default data`)
      if (path.includes('navigation.json')) return { navigationItems: [] }
      return {}
    }

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
    }

    // raw 模式返回文件原文；如果是 JSON 文件可以直接解析
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      return text // 若不是 JSON（比如 md），直接返回文本
    }
  } catch (error) {
    console.error('Error fetching file:', error)
    if (path.includes('navigation.json')) return { navigationItems: [] }
    return {}
  }
}

// 你原来的 commitFile 保持不变
export async function commitFile(
  path: string,
  content: string,
  message: string,
  token: string,
  retryCount = 3
) {
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!
  const branch = process.env.GITHUB_BRANCH || 'main'

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const currentFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      const currentFileResponse = await fetch(currentFileUrl, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'NavSphere',
        },
        cache: 'no-store',
      })

      let sha = undefined
      if (currentFileResponse.ok) {
        const currentFile = await currentFileResponse.json()
        sha = currentFile.sha
      }

      const updateUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'NavSphere',
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString('base64'),
          sha,
          branch,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (attempt < retryCount && error.message?.includes('sha')) {
          console.log(`Attempt ${attempt} failed, retrying after delay...`)
          await delay(1000 * attempt)
          continue
        }
        throw new Error(`Failed to commit file: ${error.message}`)
      }

      return await response.json()
    } catch (error) {
      if (attempt === retryCount) {
        console.error('Error in commitFile:', error)
        throw error
      }
      console.log(`Attempt ${attempt} failed, retrying...`)
      await delay(1000 * attempt)
    }
  }
}
