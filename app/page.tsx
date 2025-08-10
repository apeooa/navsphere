import { ScrollToTop } from '@/components/ScrollToTop'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  return (
    <div style={{ padding: 24 }}>
      <div>only ScrollToTop</div>
      <ScrollToTop />
    </div>
  )
}
