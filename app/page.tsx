import { headers } from 'next/headers'
import { NavigationContent } from '@/components/navigation-content'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

async function getData() {
  const base = process.env.NEXT_PUBLIC_API_URL!
  const cookieHeader = headers().get('cookie') ?? ''   // ← 取到 ns_access

  const reqInit: RequestInit = {
    cache: 'no-store',
    headers: { cookie: cookieHeader },                 // ← 转发给 API
  }

  const [navRes, siteRes] = await Promise.all([
    fetch(new URL('/api/home/navigation', base).toString(), reqInit),
    fetch(new URL('/api/home/site', base).toString(), reqInit),
  ])

  if (!navRes.ok || !siteRes.ok) {
    throw new Error(`api error: nav ${navRes.status} / site ${siteRes.status}`)
  }

  return {
    navigationData: await navRes.json(),
    siteData: await siteRes.json(),
  }
}

export default async function HomePage() {
  const { navigationData, siteData } = await getData()
  return (
    <div style={{ padding: 24 }}>
      <NavigationContent navigationData={navigationData} siteData={siteData} />
    </div>
  )
}
