import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const secret = req.headers.get('x-revalidate-token')
  if (!process.env.REVALIDATE_TOKEN || secret !== process.env.REVALIDATE_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tags } = await req.json().catch(() => ({ tags: ['site', 'navigation'] }))
  const list = Array.isArray(tags) && tags.length ? tags : ['site', 'navigation']
  list.forEach(t => revalidateTag(t))

  return NextResponse.json({ ok: true, tags: list })
}
