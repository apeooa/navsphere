import { NavigationContent } from '@/components/navigation-content'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

async function getData() {
  const base = process.env.NEXT_PUBLIC_API_URL!
  const [navRes, siteRes] = await Promise.all([
    fetch(new URL('/api/home/navigation', base).toString(), { cache: 'no-store' }),
    fetch(new URL('/api/home/site', base).toString(), { cache: 'no-store' }),
  ])
  return { navigationData: await navRes.json(), siteData: await siteRes.json() }
}

export default async function HomePage() {
  const { navigationData, siteData } = await getData()
  return (
    <div style={{ padding: 24 }}>
      <div>only NavigationContent</div>
      <NavigationContent navigationData={navigationData} siteData={siteData} />
    </div>
  )
}
